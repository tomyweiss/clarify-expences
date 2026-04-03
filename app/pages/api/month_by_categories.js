import { createApiHandler } from "./utils/apiHandler";

const handler = createApiHandler({
  validate: (req) => {
    const { month } = req.query;
    if (!month) return "Month parameter is required";
  },
  query: async (req) => ({
    sql: `
      SELECT name, SUM(transaction_count) AS transaction_count, ROUND(SUM(value)) AS value
      FROM (
        SELECT category as name, COUNT(*) AS transaction_count, SUM(price) AS value
        FROM transactions
        WHERE TO_CHAR(date, 'YYYY-MM') = $1 
        AND category != 'Bank'
        GROUP BY category
        
        UNION ALL
        
        SELECT category as name, 1 AS transaction_count, amount AS value
        FROM recurrent_transactions
        WHERE (start_date <= ($1 || '-01')::DATE + INTERVAL '1 month' - INTERVAL '1 day')
        AND (end_date IS NULL OR end_date >= ($1 || '-01')::DATE)
        AND EXISTS (SELECT 1 FROM transactions WHERE TO_CHAR(date, 'YYYY-MM') = $1 AND category != 'Bank')
      ) combined
      GROUP BY name
    `,
    params: [req.query.month]
  })
});

export default handler;
