import { getDB } from './db';

export default async function handler(req, res) {
  const client = await getDB();
  try {
    switch (req.method) {
      case 'GET': {
        const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
        const result = await client.query(
          `SELECT id, triggered_by, vendor, start_date, status, message, created_at
           FROM scrape_events
           ORDER BY created_at DESC
           LIMIT $1`,
          [limit]
        );
        res.status(200).json(result.rows);
        break;
      }
      default:
        res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in /api/scrape_events:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
}
