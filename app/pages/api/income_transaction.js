import { createApiHandler } from "./utils/apiHandler";

const handler = createApiHandler({
  validate: (req) => {
    if (req.method !== 'POST') {
      return "Only POST method is allowed";
    }
    const { name, amount, date } = req.body;
    if (!name || !amount || !date) {
      return "Name, amount, and date are required";
    }
  },
  query: async (req) => {
    const { name, amount, date } = req.body;
    
    // Generate a unique identifier for the income transaction
    const identifier = `income_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      sql: `
        INSERT INTO transactions (
          identifier,
          vendor,
          date,
          name,
          price,
          category,
          type,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      params: [
        identifier,
        'manual_income', // vendor for manually added income
        new Date(date),
        name,
        amount, // positive amount for income
        'Bank', // category as Bank for income
        'income', // type as income
        'completed' // status
      ]
    };
  },
  transform: (_) => {
    return { success: true };
  }
});

export default handler; 