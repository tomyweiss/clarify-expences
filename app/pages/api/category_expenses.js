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
          SELECT name, price, date, category, identifier, vendor
          FROM (
            SELECT name, price, date, category, identifier, vendor
            FROM transactions 
            WHERE TO_CHAR(date, 'YYYY-MM') = $1
            
            UNION ALL
            
            SELECT name, amount AS price, ($1 || '-01')::DATE AS date, category, 'recurrent-' || id AS identifier, 'recurrent' AS vendor
            FROM recurrent_transactions
            WHERE (start_date <= ($1 || '-01')::DATE + INTERVAL '1 month' - INTERVAL '1 day')
            AND (end_date IS NULL OR end_date >= ($1 || '-01')::DATE)
            AND EXISTS (SELECT 1 FROM transactions WHERE TO_CHAR(date, 'YYYY-MM') = $1)
          ) combined
          ORDER BY date DESC
        `,
        params: [month]
      };
    }
    
    return {
      sql: `
        SELECT name, price, date, category, identifier, vendor
        FROM (
          SELECT name, price, date, category, identifier, vendor
          FROM transactions 
          WHERE TO_CHAR(date, 'YYYY-MM') = $1 
          AND category = $2
          
          UNION ALL
          
          SELECT name, amount AS price, ($1 || '-01')::DATE AS date, category, 'recurrent-' || id AS identifier, 'recurrent' AS vendor
          FROM recurrent_transactions
          WHERE category = $2
          AND (start_date <= ($1 || '-01')::DATE + INTERVAL '1 month' - INTERVAL '1 day')
          AND (end_date IS NULL OR end_date >= ($1 || '-01')::DATE)
          AND EXISTS (SELECT 1 FROM transactions WHERE TO_CHAR(date, 'YYYY-MM') = $1 AND category = $2)
        ) combined
        ORDER BY date DESC
      `,
      params: [month, category]
    };
  }
});

export default handler;
