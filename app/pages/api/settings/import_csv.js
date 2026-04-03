import { getDB } from '../db';
import { withAuth } from '../middleware/auth';
import * as XLSX from 'xlsx';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { csvContent } = req.body;
  if (!csvContent) {
    return res.status(400).json({ message: 'No CSV content provided' });
  }

  const client = await getDB();
  try {
    // Parse CSV using XLSX
    const workbook = XLSX.read(csvContent, { type: 'string' });
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (data.length === 0) {
      return res.status(400).json({ message: 'CSV is empty or invalid' });
    }

    let importedCount = 0;
    let skippedCount = 0;

    await client.query('BEGIN');

    for (const row of data) {
      // Map CSV columns back to database columns
      // Note: XLSX might change keys if they have spaces or special characters
      // We should handle both cases (database column names and human-friendly headers)
      
      const identifier = row.identifier || row.Identifier;
      const vendor = row.vendor || row.Vendor;
      const date = row.date || row.Date;
      const name = row.name || row.Name;
      const price = row.price || row.Price;
      const category = row.category || row.Category;
      const type = row.type || row.Type;
      const processed_date = row.processed_date || row['Processed Date'];
      const original_amount = row.original_amount || row['Original Amount'];
      const original_currency = row.original_currency || row['Original Currency'];
      const charged_currency = row.charged_currency || row['Charged Currency'];
      const memo = row.memo || row.Memo;
      const status = row.status || row.Status;
      const installments_number = row.installments_number || row['Installments Number'];
      const installments_total = row.installments_total || row['Installments Total'];

      if (!identifier || !vendor || !date || !name) {
        skippedCount++;
        continue;
      }

      const result = await client.query(
        `INSERT INTO transactions (
          identifier, vendor, date, name, price, category, type, processed_date, 
          original_amount, original_currency, charged_currency, memo, status, 
          installments_number, installments_total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (identifier, vendor) DO NOTHING`,
        [
          identifier,
          vendor,
          new Date(date),
          name,
          parseFloat(price),
          category || 'N/A',
          type,
          processed_date ? new Date(processed_date) : null,
          original_amount ? parseFloat(original_amount) : null,
          original_currency,
          charged_currency,
          memo,
          status,
          installments_number ? parseInt(installments_number) : null,
          installments_total ? parseInt(installments_total) : null
        ]
      );

      if (result.rowCount > 0) {
        importedCount++;
      } else {
        skippedCount++;
      }
    }

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Import completed successfully',
      importedCount,
      skippedCount,
      totalProcessed: data.length
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Import CSV error:', error);
    res.status(500).json({ message: 'Failed to import transactions', error: error.message });
  } finally {
    client.release();
  }
}

export default withAuth(handler);
