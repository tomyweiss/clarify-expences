import { createAuthenticatedApiHandler } from "../middleware/auth";
import { decrypt, encrypt } from "../utils/encryption";

const handler = createAuthenticatedApiHandler({
  validate: (req) => {
    if (!['DELETE', 'GET', 'PUT'].includes(req.method)) {
      return "Only DELETE, GET and PUT methods are allowed";
    }
    if (!req.query.id) {
      return "ID parameter is required";
    }
    if (req.method === 'PUT') {
      const { vendor, nickname } = req.body;
      if (!vendor) return "Vendor is required";
      if (!nickname) return "Nickname is required";
    }
  },
  query: async (req) => {
    const { id } = req.query;

    if (req.method === 'DELETE') {
      return {
        sql: `
          DELETE FROM vendor_credentials 
          WHERE id = $1
        `,
        params: [id]
      };
    }

    if (req.method === 'PUT') {
      const { vendor, username, password, id_number, card6_digits, card_suffixes, nickname, bank_account_number } = req.body;

      // Build dynamic SET clause - only update fields that are provided
      const setClauses = [];
      const params = [];
      let paramIndex = 1;

      // Always update these
      setClauses.push(`vendor = $${paramIndex++}`);
      params.push(vendor);

      setClauses.push(`nickname = $${paramIndex++}`);
      params.push(nickname);

      // Encrypt and update optional fields
      if (username !== undefined) {
        setClauses.push(`username = $${paramIndex++}`);
        params.push(username ? encrypt(username) : null);
      }

      if (id_number !== undefined) {
        setClauses.push(`id_number = $${paramIndex++}`);
        params.push(id_number ? encrypt(id_number) : null);
      }

      if (card6_digits !== undefined) {
        setClauses.push(`card6_digits = $${paramIndex++}`);
        params.push(card6_digits ? encrypt(card6_digits) : null);
      }

      if (card_suffixes !== undefined) {
        setClauses.push(`card_suffixes = $${paramIndex++}`);
        params.push(card_suffixes || null);
      }

      if (bank_account_number !== undefined) {
        setClauses.push(`bank_account_number = $${paramIndex++}`);
        params.push(bank_account_number || null);
      }

      // Only update password if a new one is provided (non-empty)
      if (password) {
        setClauses.push(`password = $${paramIndex++}`);
        params.push(encrypt(password));
      }

      params.push(id);

      return {
        sql: `
          UPDATE vendor_credentials 
          SET ${setClauses.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `,
        params
      };
    }

    // GET method - fetch credentials for scraping
    if (req.method === 'GET') {
      return {
        sql: `
          SELECT * FROM vendor_credentials 
          WHERE id = $1
        `,
        params: [id]
      };
    }
  },
  transform: (result, req) => {
    if (req.method === 'DELETE') {
      return { success: true };
    }
    
    if (req.method === 'PUT' && result.rows && result.rows[0]) {
      const row = result.rows[0];
      return {
        id: row.id,
        vendor: row.vendor,
        username: row.username ? decrypt(row.username) : null,
        id_number: row.id_number ? decrypt(row.id_number) : null,
        card6_digits: row.card6_digits ? decrypt(row.card6_digits) : null,
        card_suffixes: row.card_suffixes || null,
        nickname: row.nickname,
        bank_account_number: row.bank_account_number,
        created_at: row.created_at
      };
    }

    // GET method - decrypt and return credentials including password
    if (req.method === 'GET' && result.rows && result.rows[0]) {
      const row = result.rows[0];
      return {
        id: row.id,
        vendor: row.vendor,
        username: row.username ? decrypt(row.username) : null,
        password: row.password ? decrypt(row.password) : null,
        id_number: row.id_number ? decrypt(row.id_number) : null,
        card6_digits: row.card6_digits ? decrypt(row.card6_digits) : null,
        card_suffixes: row.card_suffixes || null,
        nickname: row.nickname,
        bank_account_number: row.bank_account_number,
        created_at: row.created_at
      };
    }
    
    return { success: true };
  }
});

export default handler; 