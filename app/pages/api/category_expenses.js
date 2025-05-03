import { createApiHandler } from "./utils/apiHandler";

const handler = createApiHandler({
  validate: (req) => {
    const { month, category, all } = req.query;
    if (!month) return "Month parameter is required";
    if (!category && all !== "true") return "Either category or all=true is required";
  },
  query: async (req) => {
    const { month, category, all } = req.query;
    
    if (all === "true") {
      return {
        sql: `
          SELECT 
            name,
            price,
            date,
            category,
            identifier,
            vendor
          FROM transactions 
          WHERE TO_CHAR(date, 'YYYY-MM') = $1 
          ORDER BY date DESC
        `,
        params: [month]
      };
    }
    
    return {
      sql: `
        SELECT 
          name,
          price,
          date,
          identifier,
          vendor
        FROM transactions 
        WHERE TO_CHAR(date, 'YYYY-MM') = $1 
        AND category = $2
        ORDER BY date DESC
      `,
      params: [month, category]
    };
  }
});

export default handler;
