import { createApiHandler } from "./utils/apiHandler";

const handler = createApiHandler({
  query: async () => ({
    sql: "SELECT ARRAY_AGG(DISTINCT TO_CHAR(date, 'YYYY-MM')) FROM transactions;",
  }),
  transform: (result) => result.rows[0]?.array_agg || [],
});

export default handler;
