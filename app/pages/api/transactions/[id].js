import { createAuthenticatedApiHandler } from "../middleware/auth";

const handler = createAuthenticatedApiHandler({
  validate: (req) => {
    if (!['DELETE', 'PUT'].includes(req.method)) {
      return "Only DELETE and PUT methods are allowed";
    }
    if (!req.query.id) {
      return "ID parameter is required";
    }
    if (req.method === 'PUT' && !req.body?.price && !req.body?.category && !req.body?.name) {
      return "Price, category, or name is required for updates";
    }
  },
  query: async (req) => {
    const { id } = req.query;
    const [identifier, vendor] = id.split('|');

    if (req.method === 'DELETE') {
      return {
        sql: `
          DELETE FROM transactions 
          WHERE identifier = $1 AND vendor = $2
        `,
        params: [identifier, vendor]
      };
    }

    // PUT method for updating price and/or category
    const updates = [];
    const params = [identifier, vendor];
    let paramIndex = 3;

    if (req.body.price !== undefined) {
      updates.push(`price = $${paramIndex}`);
      params.push(req.body.price);
      paramIndex++;
    }

    if (req.body.category !== undefined) {
      updates.push(`category = $${paramIndex}`);
      params.push(req.body.category);
      paramIndex++;
    }

    if (req.body.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      params.push(req.body.name);
      paramIndex++;
    }

    return {
      sql: `
        UPDATE transactions 
        SET ${updates.join(', ')}
        WHERE identifier = $1 AND vendor = $2
      `,
      params: params
    };
  },
  transform: (_) => {
    return { success: true };
  }
});

export default handler; 