import { createAuthenticatedApiHandler } from "./middleware/auth";

const handler = createAuthenticatedApiHandler({
  validate: (req) => {
    if (!['GET', 'POST', 'PUT', 'DELETE'].includes(req.method)) {
      return "Only GET, POST, PUT, and DELETE methods are allowed";
    }
    
    if (req.method === 'POST') {
      const { name, amount, start_date } = req.body;
      if (!name || amount === undefined || !start_date) {
        return "Name, amount, and start_date are required";
      }
    }
  },
  query: async (req) => {
    if (req.method === 'GET') {
      return {
        sql: `
          SELECT id, name, amount, category, start_date, end_date, type, created_at, updated_at
          FROM recurrent_transactions
          ORDER BY start_date DESC
        `,
        params: []
      };
    }
    
    if (req.method === 'POST') {
      const { name, amount, category, start_date, end_date, type } = req.body;
      return {
        sql: `
          INSERT INTO recurrent_transactions (name, amount, category, start_date, end_date, type)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `,
        params: [name, amount, category, new Date(start_date), end_date ? new Date(end_date) : null, type || 'expense']
      };
    }
    
    if (req.method === 'PUT') {
      const { id, name, amount, category, start_date, end_date, type } = req.body;
      return {
        sql: `
          UPDATE recurrent_transactions 
          SET name = $2, amount = $3, category = $4, start_date = $5, end_date = $6, type = $7, updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *
        `,
        params: [id, name, amount, category, new Date(start_date), end_date ? new Date(end_date) : null, type || 'expense']
      };
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.query; // Assuming DELETE /api/recurrent_transactions?id=...
      return {
        sql: `
          DELETE FROM recurrent_transactions 
          WHERE id = $1
        `,
        params: [id]
      };
    }
  },
  transform: (result, req) => {
    if (req.method === 'GET') {
      return result.rows;
    }
    if (req.method === 'POST' || req.method === 'PUT') {
      return result.rows[0];
    }
    return { success: true };
  }
});

export default handler;
