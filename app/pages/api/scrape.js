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
  isHeadless,
  createScrapeEvent,
  updateScrapeEvent
} from './scraper-utils';

puppeteerExtra.use(StealthPlugin());

async function performScrape(options, credentials, scraperCredentials, isBank) {
  const client = await getDB();
  let browser;
  let eventId;
  try {
    const companyId = CompanyTypes[options.companyId];
    eventId = await createScrapeEvent(client, options.companyId, options.startDate, credentials.nickname);

    browser = await puppeteerExtra.launch({
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
      timeout: 1200000,
      defaultTimeout: 180000,
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
    const result = await scraper.scrape(scraperCredentials);

    if (!result.success) {
      const errorMsg = result.errorMessage || result.errorType || 'Scraping failed';
      await updateScrapeEvent(client, eventId, 'failed', errorMsg);
      return { 
        success: false, 
        error: errorMsg
      };
    }

    let totalTransactions = 0;
    for (const account of result.accounts) {
      for (const txn of account.txns) {
        await insertTransaction(txn, client, options.companyId, isBank, account.accountNumber);
        totalTransactions++;
      }
    }

    await applyCategorizationRules(client);

    await updateScrapeEvent(client, eventId, 'success', `Scraped ${Array.isArray(result.accounts) ? result.accounts.length : 0} accounts, ${totalTransactions} transactions`);

    return {
      success: true,
      accountsCount: Array.isArray(result.accounts) ? result.accounts.length : 0,
      transactionsCount: totalTransactions
    };
  } catch (error) {
    if (eventId) {
      await updateScrapeEvent(client, eventId, 'failed', error.message || 'An unexpected error occurred during performScrape');
    }
    throw error;
  } finally {
    if (browser) await browser.close();
    client.release();
  }
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { options, credentials } = req.body;
    const companyId = CompanyTypes[options.companyId];
    if (!companyId) {
      return res.status(400).json({ message: 'Invalid company ID' });
    }

    const isBank = BANK_VENDORS.includes(options.companyId);

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
        return res.status(400).json({ message: 'Bank username/ID is required' });
      }
    } else if (BANK_VENDORS.includes(options.companyId)) {
      const bankId = credentials.username || credentials.id || credentials.id_number || '';
      const bankNum = credentials.bankAccountNumber || credentials.bank_account_number || '';
      scraperCredentials = {
        id: String(bankId),
        password: String(credentials.password || ''),
        num: String(bankNum)
      };
      if (!scraperCredentials.id || !scraperCredentials.num) {
        return res.status(400).json({ message: 'Bank ID and account number are required' });
      }
    } else {
      scraperCredentials = {
        id: String(credentials.id || credentials.id_number || credentials.username || ''),
        card6Digits: String(credentials.card6Digits || credentials.card6_digits || ''),
        password: String(credentials.password || '')
      };
    }

    // Perform the scrape (blocking)
    const result = await performScrape(options, credentials, scraperCredentials, isBank);

    if (result.success) {
      return res.status(200).json({
        message: 'Scraping and import completed successfully',
        ...result
      });
    } else {
      return res.status(500).json({
        message: 'Scraping failed',
        error: result.error
      });
    }

  } catch (error) {
    console.error('Scrape handler error:', error);
    res.status(500).json({
      message: 'An unexpected error occurred during scraping',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default withAuth(handler);
