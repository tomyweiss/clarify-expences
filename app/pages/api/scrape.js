import { CompanyTypes, createScraper } from 'israeli-bank-scrapers';
import crypto from 'crypto';
import { getDB } from './db';
import { BANK_VENDORS, BEINLEUMI_GROUP_VENDORS } from '../../utils/constants';
import { withAuth } from './middleware/auth';

async function insertTransaction(txn, client, companyId, isBank) {
  const uniqueId = `${txn.identifier}-${companyId}-${txn.processedDate}-${txn.description}`;
  const hash = crypto.createHash('sha1');
  hash.update(uniqueId);
  txn.identifier = hash.digest('hex');

  let amount = txn.originalAmount;
  let category = txn.category;
  if (!isBank){
    amount = txn.originalAmount * -1;
  }else{
    category = "Bank";
  }

  try {
    await client.query(
      `INSERT INTO transactions (
        identifier,
        vendor,
        date,
        name,
        price,
        category,
        type,
        processed_date,
        original_amount,
        original_currency,
        charged_currency,
        memo,
        status,
        installments_number,
        installments_total
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (identifier, vendor) DO NOTHING`,
      [
        txn.identifier,
        companyId,
        new Date(txn.date),
        txn.description,
        amount,
        category || 'N/A',
        txn.type,
        txn.processedDate,
        txn.originalAmount,
        txn.originalCurrency,
        txn.chargedCurrency,
        txn.memo,
        txn.status,
        txn.installments?.number,
        txn.installments?.total
      ]
    );
  } catch (error) {
    console.error("Error inserting transaction:", error);
    throw error;
  }
}

async function applyCategorizationRules(client) {
  try {
    // Get all active categorization rules
    const rulesResult = await client.query(`
      SELECT id, name_pattern, target_category
      FROM categorization_rules
      WHERE is_active = true
      ORDER BY id
    `);
    
    const rules = rulesResult.rows;
    let totalUpdated = 0;
    
    // Apply each rule to transactions that don't already have the target category
    for (const rule of rules) {
      const pattern = `%${rule.name_pattern}%`;
      const updateResult = await client.query(`
        UPDATE transactions 
        SET category = $2
        WHERE LOWER(name) LIKE LOWER($1) 
        AND category != $2
        AND category IS NOT NULL
        AND category != 'Bank'
        AND category != 'Income'
      `, [pattern, rule.target_category]);
      
      totalUpdated += updateResult.rowCount;
    }
    
    console.log(`Applied ${rules.length} rules to ${totalUpdated} transactions`);
    return { rulesApplied: rules.length, transactionsUpdated: totalUpdated };
  } catch (error) {
    console.error('Error applying categorization rules:', error);
    throw error;
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
    

    // Determine Chrome/Chromium executable path based on environment
    const getChromePath = () => {
      // Check for environment variable first (Docker)
      if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        return process.env.PUPPETEER_EXECUTABLE_PATH;
      }
      
      // Auto-detect based on platform
      const platform = process.platform;
      if (platform === 'linux') {
        return '/usr/bin/chromium'; // Docker/Linux default
      } else if (platform === 'darwin') {
        return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'; // macOS
      } else if (platform === 'win32') {
        return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'; // Windows
      }
      
      // Let puppeteer auto-detect
      return undefined;
    };

    const scraperOptions = {
      ...options,
      companyId,
      startDate: new Date(options.startDate),
      showBrowser: isBank,
      verbose: true,
      timeout: 120000, // 120 seconds timeout for each operation (increased)
      executablePath: getChromePath(),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--window-size=1920,1080',
        '--disable-web-security' // Sometimes helps with iframe issues
      ],
      // Add a slight delay to help with timing issues
      defaultTimeout: 30000
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
    const insertAudit = await client.query(
      `INSERT INTO scrape_events (triggered_by, vendor, start_date, status, message)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [
        triggeredBy,
        options.companyId,
        new Date(options.startDate),
        'started',
        'Scrape initiated'
      ]
    );
    const auditId = insertAudit.rows[0]?.id;

    // SECURITY: Removed sensitive logging
    let result;
    try {
      result = await scraper.scrape(scraperCredentials);
    } catch (scrapeError) {
      if (auditId) {
        await client.query(
          `UPDATE scrape_events SET status = $1, message = $2 WHERE id = $3`,
          ['failed', scrapeError.message || 'Scraper exception', auditId]
        );
      }
      throw new Error(`Scraper exception: ${scrapeError.message}`);
    }
    
    // SECURITY: Removed sensitive result logging
    
    if (!result.success) {
      // Update audit as failed with detailed error information
      const errorMsg = result.errorMessage || result.errorType || 'Scraping failed';
      const errorDetails = {
        errorType: result.errorType,
        errorMessage: result.errorMessage,
        companyId: options.companyId,
        ...(result.errorDetails && { errorDetails: result.errorDetails })
      };
      // SECURITY: Log errors without sensitive details
      console.error('Scraping failed:', result.errorType || 'GENERIC');
      
      if (auditId) {
        await client.query(
          `UPDATE scrape_events SET status = $1, message = $2 WHERE id = $3`,
          ['failed', errorMsg, auditId]
        );
      }
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
    if (auditId) {
      const accountsCount = Array.isArray(result.accounts) ? result.accounts.length : 0;
      const message = `Success: accounts=${accountsCount}, bankTxns=${bankTransactions}`;
      await client.query(
        `UPDATE scrape_events SET status = $1, message = $2 WHERE id = $3`,
        ['success', message, auditId]
      );
    }

    res.status(200).json({
      message: 'Scraping and database update completed successfully',
      accounts: result.accounts
    });
  } catch (error) {
    console.error('Scraping failed:', error);
    // Attempt to log failure if an audit row exists in scope
    try {
      if (typeof auditId !== 'undefined' && auditId) {
        await client.query(
          `UPDATE scrape_events SET status = $1, message = $2 WHERE id = $3`,
          ['failed', error instanceof Error ? error.message : 'Unknown error', auditId]
        );
      }
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