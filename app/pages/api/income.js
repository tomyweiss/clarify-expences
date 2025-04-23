import { createApiHandler } from "./utils/apiHandler";

const handler = createApiHandler({
  validate: (req) => {
    // If there's a body, treat it as POST
    if (req.body && Object.keys(req.body).length > 0) {
      const { income_type, amount, date } = req.body;
      if (!income_type || !amount || !date) {
        return "Income type, amount, and date are required";
      }
    } 
    // If there's a month query param, treat it as GET
    else if (req.query.month) {
      const { month } = req.query;
      if (!month) {
        return "Month parameter is required";
      }
    } else {
      return "Either income data or month parameter is required";
    }
  },
  query: async (req) => {
    // If there's a body, treat it as POST
    if (req.body && Object.keys(req.body).length > 0) {
      return {
        sql: `
          INSERT INTO income (income_type, amount, date) 
          VALUES ($1, $2, $3)
        `,
        params: [req.body.income_type, req.body.amount, req.body.date]
      };
    } 
    // Otherwise treat it as GET
    else {
      const [year, monthNum] = req.query.month.split('-');
      return {
        sql: `
          SELECT 
            income_type,
            amount,
            date
          FROM income 
          WHERE TO_CHAR(date, 'MM') = $1 
          AND TO_CHAR(date, 'YYYY') = $2
          ORDER BY date DESC
        `,
        params: [monthNum, year]
      };
    }
  },
  transform: (result, req) => {
    // If there's a body, treat it as POST
    if (req.body && Object.keys(req.body).length > 0) {
      return { success: true };
    } 
    // Otherwise treat it as GET
    else {
      return result.rows.map(row => ({
        income_type: row.income_type,
        amount: parseFloat(row.amount),
        date: row.date
      }));
    }
  }
});

export default handler;
