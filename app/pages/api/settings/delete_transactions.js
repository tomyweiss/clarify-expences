import { getDB } from '../db';
import { withAuth } from '../middleware/auth';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const client = await getDB();
  try {
    // Start a transaction
    await client.query('BEGIN');

    // Delete all transactions
    await client.query('DELETE FROM transactions');

    // Also delete all scrape events as they are related to transactions data?
    // User said "delete only transactions data", but scrape events are essentially metadata about the transactions.
    // I think it's better to keep events for now as it's not strictly "transactions".
    // Alternatively, I could just delete transactions.
    
    // Commit the transaction
    await client.query('COMMIT');

    res.status(200).json({ message: 'All transactions have been deleted successfully' });
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error deleting transactions:', error);
    res.status(500).json({ 
      message: 'Failed to delete transactions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
}

export default withAuth(handler);
