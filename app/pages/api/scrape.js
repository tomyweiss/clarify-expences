import { CompanyTypes, createScraper } from 'israeli-bank-scrapers';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { getDB } from './db';
import { BANK_VENDORS, BEINLEUMI_GROUP_VENDORS } from '../../utils/constants';
import { withAuth } from './middleware/auth';
import {
  insertTransaction,
  applyCategorizationRules,
  getChromePath,
  getLaunchArgs,
  createAuditEntry,
  updateAuditEntry
} from './scraper-utils';

puppeteerExtra.use(StealthPlugin());

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const client = await getDB();
  let auditId;
  try {
    const { options, credentials } = req.body;
    const companyId = CompanyTypes[options.companyId];
    if (!companyId) {
      throw new Error('Invalid company ID');
    }

    let isBank = false;
    if (BANK_VENDORS.includes(options.companyId)){
      isBank = true;
    }

    // Prepare credentials based on company type
    // IMPORTANT: All values must be strings for Puppeteer's page.type() method
    let scraperCredentials;

    if (options.companyId === 'visaCal' || options.companyId === 'max') {
      // VisaCal and Max use username/password
      scraperCredentials = {
        username: String(credentials.username || ''),
        password: String(credentials.password || '')
      };
    } else if (BEINLEUMI_GROUP_VENDORS.includes(options.companyId)) {
      // Beinleumi Group banks (otsarHahayal, beinleumi, massad, pagi) use username/password only
      // Note: These banks use the ID as 'username', not separate id/num fields
      const bankUsername = credentials.username || credentials.id || credentials.id_number || '';

      scraperCredentials = {
        username: String(bankUsername),
        password: String(credentials.password || '')
      };

      // Validate required fields
      if (!scraperCredentials.username) {
        throw new Error('Bank username/ID is required for Beinleumi Group bank scraping');
      }
    } else if (BANK_VENDORS.includes(options.companyId)) {
      // Standard banks (discount, hapoalim, leumi, etc.) use id/password/num
      const bankId = credentials.username || credentials.id || credentials.id_number || '';
      const bankNum = credentials.bankAccountNumber || credentials.bank_account_number || '';

      scraperCredentials = {
        id: String(bankId),
        password: String(credentials.password || ''),
        num: String(bankNum)
      };

      // Validate required fields for standard banks
      if (!scraperCredentials.id || scraperCredentials.id === 'undefined') {
        throw new Error('Bank ID is required for bank scraping');
      }
      if (!scraperCredentials.num || scraperCredentials.num === 'undefined') {
        throw new Error('Bank account number is required for bank scraping');
      }
    } else {
      // Credit cards (isracard, amex, etc.)
      scraperCredentials = {
        id: String(credentials.id || credentials.id_number || credentials.username || ''),
        card6Digits: String(credentials.card6Digits || credentials.card6_digits || ''),
        password: String(credentials.password || '')
      };
    }


    const browser = await puppeteerExtra.launch({
      headless: false,
      executablePath: getChromePath(),
      args: getLaunchArgs(),
    });

    const scraperOptions = {
      ...options,
      companyId,
      startDate: new Date(options.startDate),
      browser,
      verbose: true,
      timeout: 120000,
      defaultTimeout: 30000,
      preparePage: async (page) => {
        // Intercept API calls to Isracard's proxy and add headers that a real browser would send.
        // The WAF (Akamai) blocks requests missing Referer/X-Requested-With.
        // This handler runs after the library enables request interception in login().
        page.on('request', (request) => {
          if (request.url().includes('/services/ProxyRequestHandler')) {
            const headers = {
              ...request.headers(),
              'Referer': 'https://digital.isracard.co.il/personalarea/Dashboard',
              'X-Requested-With': 'XMLHttpRequest',
            };
            void request.continue({ headers }, 50); // priority 50 > library's default 10
          }
        });
      },
    };

    // SECURITY: Removed sensitive logging
    // Validate that all credential values are strings and not undefined
    for (const [key, value] of Object.entries(scraperCredentials)) {
      if (typeof value !== 'string') {
        throw new Error(`Credential ${key} must be a string, got ${typeof value}`);
      }
      if (value === 'undefined' || value === 'null') {
        throw new Error(`Credential ${key} has invalid value`);
      }
    }

    const scraper = createScraper(scraperOptions);

    // Insert audit row: started
    const triggeredBy = credentials?.username || credentials?.id || credentials?.nickname || 'unknown';
    auditId = await createAuditEntry(client, triggeredBy, options.companyId, options.startDate);

    // SECURITY: Removed sensitive logging
    let result;
    try {
      result = await scraper.scrape(scraperCredentials);
    } catch (scrapeError) {
      await updateAuditEntry(client, auditId, 'failed', scrapeError.message || 'Scraper exception');
      throw new Error(`Scraper exception: ${scrapeError.message}`);
    }

    // SECURITY: Removed sensitive result logging

    if (!result.success) {
      // Update audit as failed with detailed error information
      const errorMsg = result.errorMessage || result.errorType || 'Scraping failed';
      // SECURITY: Log errors without sensitive details
      console.error('Scraping failed:', result.errorType || 'GENERIC');

      await updateAuditEntry(client, auditId, 'failed', errorMsg);
      throw new Error(`${result.errorType || 'GENERIC'}: ${errorMsg}`);
    }

    let bankTransactions = 0;
    for (const account of result.accounts) {
      for (const txn of account.txns) {
        if (isBank){
          bankTransactions++;
        }
        await insertTransaction(txn, client, options.companyId, isBank);
      }
    }

    await applyCategorizationRules(client);

    console.log(`Scraped ${bankTransactions} bank transactions`);

    // Update audit as success
    const accountsCount = Array.isArray(result.accounts) ? result.accounts.length : 0;
    const message = `Success: accounts=${accountsCount}, bankTxns=${bankTransactions}`;
    await updateAuditEntry(client, auditId, 'success', message);

    res.status(200).json({
      message: 'Scraping and database update completed successfully',
      accounts: result.accounts
    });
  } catch (error) {
    console.error('Scraping failed:', error);
    // Attempt to log failure if an audit row exists in scope
    try {
      await updateAuditEntry(client, auditId, 'failed', error instanceof Error ? error.message : 'Unknown error');
    } catch (e) {
      // noop - avoid masking original error
    }
    res.status(500).json({
      message: 'Scraping failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
}

// Export handler with authentication middleware
export default withAuth(handler);
