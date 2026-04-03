import { getDB } from '../db';
import { withAuth } from '../middleware/auth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const client = await getDB();
  try {
    const result = await client.query(
      `SELECT identifier, vendor, date, name, price, category, type, processed_date, 
              original_amount, original_currency, charged_currency, memo, status, 
              installments_number, installments_total 
       FROM transactions 
       ORDER BY date DESC`
    );

    const rows = result.rows;
    if (rows.length === 0) {
      // Still return a header-only CSV
      const headers = ['Identifier', 'Vendor', 'Date', 'Name', 'Price', 'Category', 'Type', 'Processed Date', 'Original Amount', 'Original Currency', 'Charged Currency', 'Memo', 'Status', 'Installments Number', 'Installments Total'];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions_export.csv');
      return res.status(200).send(headers.join(','));
    }

    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        headers.map(header => {
          let val = row[header];
          if (val === null || val === undefined) return '';
          if (val instanceof Date) return val.toISOString().split('T')[0];
          // Escape quotes and wrap in quotes if contains comma or newline
          const str = String(val).replace(/"/g, '""');
          return (str.includes(',') || str.includes('\n') || str.includes('"')) ? `"${str}"` : str;
        }).join(',')
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions_export.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ message: 'Failed to export transactions', error: error.message });
  } finally {
    client.release();
  }
}

export default withAuth(handler);
