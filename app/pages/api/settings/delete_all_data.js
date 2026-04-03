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

    // Delete all vendor credentials
    await client.query('DELETE FROM vendor_credentials');

    // Delete all categorization rules
    await client.query('DELETE FROM categorization_rules');

    // Delete all scrape events
    await client.query('DELETE FROM scrape_events');

    // Commit the transaction
    await client.query('COMMIT');

    res.status(200).json({ message: 'All data deleted successfully' });
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error deleting all data:', error);
    res.status(500).json({ 
      message: 'Failed to delete data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
}

export default withAuth(handler);
