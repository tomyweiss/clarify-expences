import { createApiHandler } from "../utils/apiHandler";

const handler = createApiHandler({
  validate: (req) => {
    if (!['DELETE', 'PUT'].includes(req.method)) {
      return "Only DELETE and PUT methods are allowed";
    }
    if (!req.query.id) {
      return "ID parameter is required";
    }
    if (req.method === 'PUT' && !req.body?.price) {
      return "Price is required for updates";
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

    // PUT method for updating price
    return {
      sql: `
        UPDATE transactions 
        SET price = $3
        WHERE identifier = $1 AND vendor = $2
      `,
      params: [identifier, vendor, req.body.price]
    };
  },
  transform: (_) => {
    return { success: true };
  }
});

export default handler; 