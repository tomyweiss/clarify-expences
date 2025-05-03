import { createApiHandler } from "./utils/apiHandler";

const handler = createApiHandler({
  validate: (req) => {
    const { month, groupByYear } = req.query;
    if (!month || !groupByYear) {
      return "month and groupByYear are required";
    }
  },
  query: async (req) => {
    const { month, groupByYear } = req.query;
    const groupByYearBool = groupByYear === "true";
    const monthNumber = parseInt(month, 10);

    if (groupByYearBool) {
      return {
        sql: `
          SELECT
            SUM(price) AS amount,
            TO_CHAR(date, 'YYYY') AS year,
            DATE_TRUNC('year', date) AS year_sort
          FROM transactions
          GROUP BY TO_CHAR(date, 'YYYY'), DATE_TRUNC('year', date)
          ORDER BY year_sort DESC
          LIMIT $1
        `,
        params: [monthNumber]
      };
    }

    return {
      sql: `
        SELECT 
          SUM(price) AS amount,
          TO_CHAR(date, 'YYYY') AS year,
          TO_CHAR(date, 'MM') AS month,
          TO_CHAR(date, 'MM-YYYY') AS year_month,
          DATE_TRUNC('month', date) AS year_sort
        FROM transactions
        GROUP BY 
          TO_CHAR(date, 'YYYY'),
          TO_CHAR(date, 'MM'),
          TO_CHAR(date, 'MM-YYYY'),
          DATE_TRUNC('month', date)
        ORDER BY year_sort DESC
        LIMIT $1
      `,
      params: [monthNumber]
    };
  },
  transform: (result) => {
    return result.rows
      .map(row => ({
        ...row,
        amount: parseFloat(row.amount) || 0
      }))
      .sort((a, b) => new Date(a.year_sort) - new Date(b.year_sort));
  }
});

export default handler; 