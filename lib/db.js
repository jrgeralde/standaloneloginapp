//lib/db.js
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Reusable database query function
export const query = (text, params) => pool.query(text, params);

// Delete session using token
export const dbdeletesession = (token) =>
  query('DELETE FROM sessions WHERE token = $1', [token]);
