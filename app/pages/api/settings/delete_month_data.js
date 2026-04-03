import { getDB } from '../db';
import { withAuth } from '../middleware/auth';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { month } = req.body;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ message: 'Invalid month format (expected YYYY-MM)' });
  }

  const client = await getDB();
  try {
    // Start a transaction
    await client.query('BEGIN');

    // Delete transactions for the specific month
    await client.query(
      "DELETE FROM transactions WHERE TO_CHAR(date, 'YYYY-MM') = $1",
      [month]
    );

    // Also delete any scrape events associated with this month
    await client.query(
      "DELETE FROM scrape_events WHERE TO_CHAR(start_date, 'YYYY-MM') = $1",
      [month]
    );

    // Commit the transaction
    await client.query('COMMIT');

    res.status(200).json({ message: `Data for ${month} deleted successfully` });
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error(`Error deleting data for month ${month}:`, error);
    res.status(500).json({ 
      message: 'Failed to delete data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
}

export default withAuth(handler);
