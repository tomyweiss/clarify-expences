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
  updateAuditEntry,
  isHeadless
} from './scraper-utils';

puppeteerExtra.use(StealthPlugin());

/**
 * Background scrape job — runs after the HTTP response has been sent.
 */
async function runScrapeInBackground(options, credentials, scraperCredentials, isBank, auditId) {
  const client = await getDB();
  try {
    const companyId = CompanyTypes[options.companyId];

    const browser = await puppeteerExtra.launch({
      headless: isHeadless(options),
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
        page.on('request', (request) => {
          if (request.url().includes('/services/ProxyRequestHandler')) {
            const headers = {
              ...request.headers(),
              'Referer': 'https://digital.isracard.co.il/personalarea/Dashboard',
              'X-Requested-With': 'XMLHttpRequest',
            };
            void request.continue({ headers }, 50);
          }
        });
      },
    };

    const scraper = createScraper(scraperOptions);

    let result;
    try {
      result = await scraper.scrape(scraperCredentials);
    } catch (scrapeError) {
      await updateAuditEntry(client, auditId, 'failed', scrapeError.message || 'Scraper exception');
      console.error('Background scrape exception:', scrapeError.message);
      return;
    }

    if (!result.success) {
      const errorMsg = result.errorMessage || result.errorType || 'Scraping failed';
      console.error('Scraping failed:', result.errorType || 'GENERIC');
      await updateAuditEntry(client, auditId, 'failed', errorMsg);
      return;
    }

    let bankTransactions = 0;
    for (const account of result.accounts) {
      for (const txn of account.txns) {
        if (isBank) {
          bankTransactions++;
        }
        await insertTransaction(txn, client, options.companyId, isBank);
      }
    }

    await applyCategorizationRules(client);

    console.log(`Scraped ${bankTransactions} bank transactions`);

    const accountsCount = Array.isArray(result.accounts) ? result.accounts.length : 0;
    const message = `Success: accounts=${accountsCount}, bankTxns=${bankTransactions}`;
    await updateAuditEntry(client, auditId, 'success', message);
  } catch (error) {
    console.error('Background scrape failed:', error);
    try {
      await updateAuditEntry(client, auditId, 'failed', error instanceof Error ? error.message : 'Unknown error');
    } catch (e) {
      // noop
    }
  } finally {
    client.release();
  }
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const client = await getDB();
  try {
    const { options, credentials } = req.body;
    const companyId = CompanyTypes[options.companyId];
    if (!companyId) {
      client.release();
      return res.status(400).json({ message: 'Invalid company ID' });
    }

    let isBank = false;
    if (BANK_VENDORS.includes(options.companyId)){
      isBank = true;
    }

    // Prepare credentials based on company type
    let scraperCredentials;

    if (options.companyId === 'visaCal' || options.companyId === 'max') {
      scraperCredentials = {
        username: String(credentials.username || ''),
        password: String(credentials.password || '')
      };
    } else if (BEINLEUMI_GROUP_VENDORS.includes(options.companyId)) {
      const bankUsername = credentials.username || credentials.id || credentials.id_number || '';
      scraperCredentials = {
        username: String(bankUsername),
        password: String(credentials.password || '')
      };
      if (!scraperCredentials.username) {
        client.release();
        return res.status(400).json({ message: 'Bank username/ID is required for Beinleumi Group bank scraping' });
      }
    } else if (BANK_VENDORS.includes(options.companyId)) {
      const bankId = credentials.username || credentials.id || credentials.id_number || '';
      const bankNum = credentials.bankAccountNumber || credentials.bank_account_number || '';
      scraperCredentials = {
        id: String(bankId),
        password: String(credentials.password || ''),
        num: String(bankNum)
      };
      if (!scraperCredentials.id || scraperCredentials.id === 'undefined') {
        client.release();
        return res.status(400).json({ message: 'Bank ID is required for bank scraping' });
      }
      if (!scraperCredentials.num || scraperCredentials.num === 'undefined') {
        client.release();
        return res.status(400).json({ message: 'Bank account number is required for bank scraping' });
      }
    } else {
      scraperCredentials = {
        id: String(credentials.id || credentials.id_number || credentials.username || ''),
        card6Digits: String(credentials.card6Digits || credentials.card6_digits || ''),
        password: String(credentials.password || '')
      };
    }

    // Validate that all credential values are strings and not undefined
    for (const [key, value] of Object.entries(scraperCredentials)) {
      if (typeof value !== 'string') {
        client.release();
        return res.status(400).json({ message: `Credential ${key} must be a string, got ${typeof value}` });
      }
      if (value === 'undefined' || value === 'null') {
        client.release();
        return res.status(400).json({ message: `Credential ${key} has invalid value` });
      }
    }

    // Create the audit entry up front so the client can track it
    const triggeredBy = credentials?.username || credentials?.id || credentials?.nickname || 'unknown';
    const auditId = await createAuditEntry(client, triggeredBy, options.companyId, options.startDate);

    // Release the validation DB connection
    client.release();

    // Respond immediately — scraping will continue in the background
    res.status(202).json({
      message: 'Scraping started in background',
      auditId,
      vendor: options.companyId,
    });

    // Fire and forget — run the actual scrape in the background
    runScrapeInBackground(options, credentials, scraperCredentials, isBank, auditId).catch(err => {
      console.error('Unhandled background scrape error:', err);
    });

  } catch (error) {
    console.error('Scrape handler error:', error);
    client.release();
    res.status(500).json({
      message: 'Failed to start scraping',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Export handler with authentication middleware
export default withAuth(handler);
