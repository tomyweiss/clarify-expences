import { CompanyTypes, createScraper } from 'israeli-bank-scrapers';
import crypto from 'crypto';
import { getDB } from './db';
import { get } from 'https';

async function insertTransaction(txn, client, companyId) {
  if (!txn.identifier || txn.identifier === ""){
    const hash = crypto.createHash('sha1');
    hash.update(txn.processed_date + companyId);
    txn.identifier = hash.digest('hex');
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
        txn.chargedAmount * -1,
        txn.category || 'N/A',
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

export default async function handler(req, res) {
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

    // Prepare credentials based on company type
    const scraperCredentials = options.companyId === 'visaCal' || options.companyId === 'max'
      ? {
          username: credentials.username,
          password: credentials.password
        }
      : {
          id: credentials.id,
          card6Digits: credentials.card6Digits,
          password: credentials.password
        };

    const scraper = createScraper({
      ...options,
      companyId,
      startDate: new Date(options.startDate),
      showBrowser: options.showBrowser,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const result = await scraper.scrape(scraperCredentials);
    console.log('Scraping result:');
    console.log(JSON.stringify(result, null, 2));
    if (!result.success) {
      throw new Error(result.errorType || 'Scraping failed');
    }

    // Insert transactions into the database
    if (result.accounts) {
      for (const account of result.accounts) {
        for (const txn of account.txns) {
          await insertTransaction(txn, client, options.companyId);
        }
      }
    }

    res.status(200).json({ 
      message: 'Scraping and database update completed successfully',
      accounts: result.accounts
    });
  } catch (error) {
    console.error('Scraping failed:', error);
    res.status(500).json({ 
      message: 'Scraping failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
} 