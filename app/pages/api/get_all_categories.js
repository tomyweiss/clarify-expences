import { createApiHandler } from "./utils/apiHandler";

const handler = createApiHandler({
  query: async () => ({
    sql: "SELECT distinct category from transactions;"
  }),
  transform: (result) => {
    const categories = result.rows.map((row) => row.category);
    return categories.sort((a, b) => a.localeCompare(b));
  }
});

export default handler;
