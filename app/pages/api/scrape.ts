import type { NextApiRequest, NextApiResponse } from 'next';
import { CompanyTypes, createScraper } from 'israeli-bank-scrapers';
import pkg from 'pg';
const { Pool } = pkg;

// Initialize the database connection pool
const pool = new Pool({
  user: process.env.CLARIFY_DB_USER,
  host: process.env.CLARIFY_DB_HOST,
  database: process.env.CLARIFY_DB_NAME,
  password: process.env.CLARIFY_DB_PASSWORD,
  port: process.env.CLARIFY_DB_PORT ? parseInt(process.env.CLARIFY_DB_PORT) : 5432
});

async function insertTransaction(txn: any, client: any): Promise<void> {
  try {
    await client.query(
      `INSERT INTO transactions (
        date,
        name,
        price,
        category,
        type,
        identifier,
        processed_date,
        original_amount,
        original_currency,
        charged_currency,
        memo,
        status,
        installments_number,
        installments_total
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (date, name, price) DO NOTHING`,
      [
        new Date(txn.date),
        txn.description,
        txn.chargedAmount * -1,
        txn.category || 'N/A',
        txn.type,
        txn.identifier,
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const client = await pool.connect();
  try {
    const { options, credentials } = req.body;
    console.log(options, credentials);
    // Convert string companyId to CompanyTypes enum
    const companyId = CompanyTypes[options.companyId as keyof typeof CompanyTypes];
    if (!companyId) {
      throw new Error('Invalid company ID');
    }

    const scraper = createScraper({
      ...options,
      companyId,
      startDate: new Date(options.startDate),
      showBrowser: options.showBrowser,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const result = await scraper.scrape(credentials);
    console.log('result');
    console.log(result);
    if (!result.success) {
      throw new Error(result.errorType || 'Scraping failed');
    }

    // Insert transactions into the database
    if (result.accounts) {
      for (const account of result.accounts) {
        for (const txn of account.txns) {
          await insertTransaction(txn, client);
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