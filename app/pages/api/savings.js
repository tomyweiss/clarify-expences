import { createAuthenticatedApiHandler } from "./middleware/auth";

const handler = createAuthenticatedApiHandler({
  validate: (req) => {
    if (!['GET', 'POST', 'PUT', 'DELETE'].includes(req.method)) {
      return "Only GET, POST, PUT, and DELETE methods are allowed";
    }
    
    if (req.method === 'POST') {
      const { type, amount, date_created, institution } = req.body;
      if (!type || amount === undefined || !date_created || !institution) {
        return "Type, amount, date_created, and institution are required";
      }
    }
    
    if (req.method === 'PUT') {
      const { id, type, amount, date_created, institution } = req.body;
      if (!id || !type || amount === undefined || !date_created || !institution) {
        return "id, type, amount, date_created, and institution are required";
      }
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) {
        return "id is required";
      }
    }
  },
  query: async (req) => {
    if (req.method === 'GET') {
      return {
        sql: `
          SELECT id, type, amount, currency, date_created, institution, risk_level, notes, last_updated
          FROM savings
          ORDER BY date_created DESC
        `,
        params: []
      };
    }
    
    if (req.method === 'POST') {
      const { type, amount, currency, date_created, institution, risk_level, notes } = req.body;
      return {
        sql: `
          INSERT INTO savings (type, amount, currency, date_created, institution, risk_level, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `,
        params: [type, amount, currency || 'ILS', new Date(date_created), institution, risk_level, notes]
      };
    }
    
    if (req.method === 'PUT') {
      const { id, type, amount, currency, date_created, institution, risk_level, notes } = req.body;
      return {
        sql: `
          UPDATE savings 
          SET type = $2, amount = $3, currency = $4, date_created = $5, institution = $6, risk_level = $7, notes = $8, last_updated = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *
        `,
        params: [id, type, amount, currency || 'ILS', new Date(date_created), institution, risk_level, notes]
      };
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.body;
      return {
        sql: `
          DELETE FROM savings 
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
