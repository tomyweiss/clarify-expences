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
            (grp.price_sum + COALESCE((
              SELECT SUM(rt.amount * 12)
              FROM recurrent_transactions rt
              WHERE rt.start_date <= (grp.year_ts + INTERVAL '1 year' - INTERVAL '1 day')
              AND (rt.end_date IS NULL OR rt.end_date >= grp.year_ts)
            ), 0)) AS amount,
            TO_CHAR(grp.year_ts, 'YYYY') AS year,
            grp.year_ts AS year_sort
          FROM (
            SELECT
              DATE_TRUNC('year', date) AS year_ts,
              SUM(price) AS price_sum
            FROM transactions
            WHERE category != 'Bank'
            GROUP BY DATE_TRUNC('year', date)
          ) grp
          ORDER BY grp.year_ts DESC
          LIMIT $1
        `,
        params: [monthNumber],
      };
    }

    return {
      sql: `
        SELECT
          (grp.price_sum + COALESCE((
            SELECT SUM(rt.amount)
            FROM recurrent_transactions rt
            WHERE rt.start_date <= (grp.month_ts + INTERVAL '1 month' - INTERVAL '1 day')
            AND (rt.end_date IS NULL OR rt.end_date >= grp.month_ts)
          ), 0)) AS amount,
          TO_CHAR(grp.month_ts, 'YYYY') AS year,
          TO_CHAR(grp.month_ts, 'MM') AS month,
          TO_CHAR(grp.month_ts, 'MM-YYYY') AS year_month,
          grp.month_ts AS year_sort
        FROM (
          SELECT
            DATE_TRUNC('month', date) AS month_ts,
            SUM(price) AS price_sum
          FROM transactions
          WHERE category != 'Bank'
          GROUP BY DATE_TRUNC('month', date)
        ) grp
        ORDER BY grp.month_ts DESC
        LIMIT $1
      `,
      params: [monthNumber],
    };
  },
  transform: (result) => {
    return result.rows.map((row) => ({
      ...row,
      amount: parseFloat(row.amount) || 0,
    }));
  },
});

export default handler;
