//lib/db.js

import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

export const query = (text, params) => pool.query(text, params);

export const dbdeletesession = (token) => query('DELETE FROM sessions WHERE token = $1', [token]);
