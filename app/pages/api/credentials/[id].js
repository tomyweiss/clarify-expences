import { createApiHandler } from "../utils/apiHandler";

const handler = createApiHandler({
  validate: (req) => {
    if (req.method !== 'DELETE') {
      return "Only DELETE method is allowed";
    }
    if (!req.query.id) {
      return "ID parameter is required";
    }
  },
  query: async (req) => {
    const { id } = req.query;

    return {
      sql: `
        DELETE FROM vendor_credentials 
        WHERE id = $1
      `,
      params: [id]
    };
  },
  transform: (_) => {
    return { success: true };
  }
});

export default handler; 