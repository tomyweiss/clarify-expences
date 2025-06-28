import { CompanyTypes, createScraper } from 'israeli-bank-scrapers';
import crypto from 'crypto';
import { getDB } from './db';
import { BANK_VENDORS } from '../../utils/constants';

async function insertTransaction(txn, client, companyId, isBank) {
  if (!txn.identifier || txn.identifier === ""){
    const hash = crypto.createHash('sha1');
    hash.update(txn.processed_date + companyId);
    txn.identifier = hash.digest('hex');
  }

  let amount = txn.chargedAmount;
  let category = txn.category;
  if (!isBank){
    amount = txn.chargedAmount * -1;
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

    let isBank = false;
    if (BANK_VENDORS.includes(options.companyId)){
      isBank = true;
    }

    // Prepare credentials based on company type
    const scraperCredentials = options.companyId === 'visaCal' || options.companyId === 'max'
      ? {
          username: credentials.username,
          password: credentials.password
        }
      : BANK_VENDORS.includes(options.companyId)
      ? {
          username: credentials.username,
          password: credentials.password,
          bankAccountNumber: credentials.bankAccountNumber || undefined
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
      showBrowser: isBank,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const result = await scraper.scrape(scraperCredentials);
    console.log('Scraping result:');
    console.log(JSON.stringify(result, null, 2));
    if (!result.success) {
      throw new Error(result.errorType || 'Scraping failed');
    }
    
    for (const account of result.accounts) {
      for (const txn of account.txns) {
        await insertTransaction(txn, client, options.companyId, isBank);
      }
    }

    await applyCategorizationRules(client);

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