import { createAuthenticatedApiHandler } from "../middleware/auth";
import { decrypt } from "../utils/encryption";

const handler = createAuthenticatedApiHandler({
  validate: (req) => {
    if (!['DELETE', 'GET'].includes(req.method)) {
      return "Only DELETE and GET methods are allowed";
    }
    if (!req.query.id) {
      return "ID parameter is required";
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

    // GET method - fetch credentials for scraping
    // SECURITY: This endpoint returns passwords and should be protected with authentication
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
        nickname: row.nickname,
        bank_account_number: row.bank_account_number,
        created_at: row.created_at
      };
    }
    
    return { success: true };
  }
});

export default handler; 