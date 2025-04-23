import { Pool } from "pg";

const pool = new Pool({
  user: process.env.CLARIFY_DB_USER,
  host: process.env.CLARIFY_DB_HOST,
  database: process.env.CLARIFY_DB_NAME,
  password: process.env.CLARIFY_DB_PASSWORD,
  port: process.env.CLARIFY_DB_PORT,
  ssl: false,
});


export async function getDB() {
  try {
    const client = await pool.connect();
    return client;
  } catch (error) {
    console.error("Error connecting to the database:", error);
    throw new Error("Database connection failed");
  }
}
