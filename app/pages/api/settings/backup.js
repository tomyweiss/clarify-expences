import { getDB } from '../db';
import { withAuth } from '../middleware/auth';

/**
 * API route to export all transaction and rule data as JSON.
 * Returns a data object that can be used for backup/restore.
 */
async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const client = await getDB();
  try {
    // 1. Fetch all transactions
    const transactionsResult = await client.query(
      `SELECT * FROM transactions ORDER BY date DESC`
    );

    // 2. Fetch all categorization rules
    const rulesResult = await client.query(
      `SELECT * FROM categorization_rules ORDER BY created_at DESC`
    );

    // Prepare export data
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        transactions: transactionsResult.rows,
        categorization_rules: rulesResult.rows
      }
    };

    res.status(200).json(exportData);
  } catch (error) {
    console.error('Export JSON error:', error);
    res.status(500).json({ 
      message: 'Failed to export backup data', 
      error: error.message 
    });
  } finally {
    client.release();
  }
}

export default withAuth(handler);
