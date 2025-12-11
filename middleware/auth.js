//middleware/auth.js

import jwt from 'jsonwebtoken';
import { query } from '../lib/db';

export async function authenticate(req, res) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new Error('No token provided');

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const session = await query('SELECT * FROM sessions WHERE token = $1', [token]);
    if (!session.rows.length) throw new Error('Invalid session');

    await query('UPDATE sessions SET last_activity = NOW() WHERE token = $1', [token]);

    req.user = decoded;
  } catch {
    throw new Error('Unauthorized');
  }
}
