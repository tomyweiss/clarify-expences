import { getDB } from '../db';
import { withAuth } from '../middleware/auth';

/**
 * Handle POST requests to restore backup data from JSON.
 * Re-imports both transactions and categorization rules.
 */
async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { backupData } = req.body;
  if (!backupData || !backupData.data) {
    return res.status(400).json({ message: 'No valid backup data provided' });
  }

  const { transactions = [], categorization_rules = [] } = backupData.data;
  const client = await getDB();

  try {
    await client.query('BEGIN');

    let transactionsImported = 0;
    let transactionsSkipped = 0;
    let rulesImported = 0;
    let rulesSkipped = 0;

    // 1. Process Transactions
    for (const tx of transactions) {
      const result = await client.query(
        `INSERT INTO transactions (
          identifier, vendor, date, name, price, category, type, processed_date, 
          original_amount, original_currency, charged_currency, memo, status, 
          installments_number, installments_total, account_number
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (identifier, vendor) DO NOTHING`,
        [
          tx.identifier,
          tx.vendor,
          tx.date,
          tx.name,
          tx.price,
          tx.category,
          tx.type,
          tx.processed_date,
          tx.original_amount,
          tx.original_currency,
          tx.charged_currency,
          tx.memo,
          tx.status,
          tx.installments_number,
          tx.installments_total,
          tx.account_number
        ]
      );
      if (result.rowCount > 0) transactionsImported++;
      else transactionsSkipped++;
    }

    // 2. Process Categorization Rules
    for (const rule of categorization_rules) {
      const result = await client.query(
        `INSERT INTO categorization_rules (
          name_pattern, target_category, is_active
        ) VALUES ($1, $2, $3)
        ON CONFLICT (name_pattern, target_category) DO NOTHING`,
        [
          rule.name_pattern,
          rule.target_category,
          rule.is_active ?? true
        ]
      );
      if (result.rowCount > 0) rulesImported++;
      else rulesSkipped++;
    }

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Restore completed successfully',
      stats: {
        transactions: { imported: transactionsImported, skipped: transactionsSkipped },
        rules: { imported: rulesImported, skipped: rulesSkipped }
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Restore JSON error:', error);
    res.status(500).json({ 
      message: 'Failed to restore backup data', 
      error: error.message 
    });
  } finally {
    client.release();
  }
}

export default withAuth(handler);
