import { createApiHandler } from "./utils/apiHandler";

const handler = createApiHandler({
  validate: (req) => {
    const { category, month, groupByYear } = req.query;
    if (!category || !month || !groupByYear) {
      return "Category, mount, and groupByYear are required";
    }
  },
  query: async (req) => {
    const { category, month, groupByYear } = req.query;
    const groupByYearBool = groupByYear === "true";
    const monthNumber = parseInt(month, 10);

    let selectFields = `
      SUM(t.price) AS amount,
      TO_CHAR(t.date, 'YYYY') AS year
    `;
    let groupBy = "year";
    let orderBy = "year DESC";
    let finalOrderBy = "year ASC";

    if (!groupByYearBool) {
      selectFields += `,
        TO_CHAR(t.date, 'MM') AS month,
        TO_CHAR(t.date, 'MM-YYYY') AS year_month
      `;
      groupBy = "year, month, year_month";
      orderBy += ", month DESC";
      finalOrderBy += ", month ASC";
    }

    return {
      sql: `
        WITH temp AS (
          SELECT ${selectFields}
          FROM transactions t
          WHERE category = $1
          GROUP BY ${groupBy}
          ORDER BY ${orderBy}
          LIMIT $2
        )
        SELECT * FROM temp ORDER BY ${finalOrderBy}
      `,
      params: [category, monthNumber]
    };
  }
});

export default handler;
