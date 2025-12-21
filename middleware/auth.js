//middleware/auth.js
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { query } from '../lib/db';


/**
 * Validates and cleans an ID to ensure it is a positive integer.
 */
const parseId = (value) => {
  if (typeof value === 'object' && value !== null) return null;
  const cleaned = typeof value === 'string' ? value.trim() : value;
  const id = Number(cleaned);
  return Number.isInteger(id) && id > 0 ? id : null;
};

/**
 * Extracts ID from params or URL. 
 * Async required for Next.js 15 'params' promise.
 */
export const extractId = async (req, params) => {
  const resolvedParams = await params;
  const fromParams = resolvedParams?.id;

  if (fromParams !== undefined && fromParams !== null) {
    const parsed = parseId(fromParams);
    if (parsed) return parsed;
  }

  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    return parseId(last);
  } catch (error) {
    return null;
  }
};

/**
 * Checks for a valid session token in cookies and returns the user_id.
 */
export async function authenticate() {
  try {
    const SESSION_TIMEOUT = process.env.SESSION_TIMEOUT_VALUE || '2 hours';

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    // 1. If no cookie, they aren't logged in
    if (!token) return null;

    // 2. Look up the token in the sessions table
    // We don't "decode" anything; we just ask the DB: "Who owns this token?"
    const result = await query(
      `SELECT user_id 
       FROM sessions 
       WHERE token = $1 
       AND last_activity > NOW() - ($2::interval)`,
      [token, SESSION_TIMEOUT]
    );

    if (result.rows.length === 0) {
      return null;
    }

    // 3. Update last activity (Sliding window)
    await query(
      'UPDATE sessions SET last_activity = NOW() WHERE token = $1',
      [token]
    );

    return { user_id: result.rows[0].user_id };

  } catch (error) {
    console.error("Database Auth Error:", error.message);
    return null; 
  }
}
/* same as authenticate but returns true or false */
export async function isLoggedIn() {
  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    const SESSION_TIMEOUT = process.env.SESSION_TIMEOUT_VALUE || '2 hours'; //'2 hours'; // PostgreSQL interval syntax, can be 20 minutes    

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return false;

    // 1. Verify the JWT signature
    const decoded = jwt.verify(token, JWT_SECRET);

    // 2. Verify the session in the DB 
    // Check if last_activity is within the timeout window
    const result = await query(
      `SELECT user_id 
       FROM sessions 
       WHERE token = $1 
       AND last_activity > NOW() - ($2::interval)`,
      [token, SESSION_TIMEOUT]
    );

    // 3. Optional: Update activity to slide the window forward
    await query(
       'UPDATE sessions SET last_activity = NOW() WHERE token = $1',
        [token]
    );
    
    // 4. Return true if a row exists (meaning it's a valid, recent session)
    return result.rows.length > 0;


  } catch (error) {
    // If JWT expires or query fails, the user is not logged in
    console.error("isLoggedIn check failed:", error.message);
    return false;
  }
}