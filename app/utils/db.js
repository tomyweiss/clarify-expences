import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.CLARIFY_DB_USER,
  host: process.env.CLARIFY_DB_HOST,
  database: process.env.CLARIFY_DB_NAME,
  password: process.env.CLARIFY_DB_PASSWORD,
  port: process.env.CLARIFY_DB_PORT ? parseInt(process.env.CLARIFY_DB_PORT) : 5432,
  ssl: false
});

export default pool; 