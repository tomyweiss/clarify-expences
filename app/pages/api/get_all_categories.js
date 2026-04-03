import { createApiHandler } from "./utils/apiHandler";

const handler = createApiHandler({
  query: async () => ({
    sql: `
      SELECT name, SUM(count) AS count
      FROM (
        SELECT category AS name, COUNT(*) AS count
        FROM transactions
        WHERE category IS NOT NULL AND category != ''
        GROUP BY category
        
        UNION ALL
        
        SELECT category AS name, COUNT(*) AS count
        FROM recurrent_transactions
        WHERE category IS NOT NULL AND category != ''
        GROUP BY category
      ) combined
      GROUP BY name
      ORDER BY count DESC
    `
  }),
  transform: (result) => result.rows.map((row) => ({ name: row.name, count: parseInt(row.count, 10) }))
});

export default handler;
