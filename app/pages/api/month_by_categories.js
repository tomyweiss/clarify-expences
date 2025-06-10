import { createApiHandler } from "./utils/apiHandler";

const handler = createApiHandler({
  validate: (req) => {
    const { month } = req.query;
    if (!month) return "Month parameter is required";
  },
  query: async (req) => ({
    sql: `
      SELECT category as name, COUNT(*) AS transaction_count, ROUND(SUM(price)) AS value
      FROM transactions
      WHERE TO_CHAR(date, 'YYYY-MM') = $1 
      AND category != 'Bank'
      GROUP BY category
    `,
    params: [req.query.month]
  })
});

export default handler;
