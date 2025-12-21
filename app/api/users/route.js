import { query } from '../../../lib/db';
import { authenticate } from '../../../middleware/auth';
import bcrypt from 'bcryptjs';

const sendJSON = (data, status = 200) => 
  new Response(JSON.stringify(data), { 
    status, 
    headers: { 'Content-Type': 'application/json' } 
  });

// GET /api/users - fetch all users
export async function GET(req) {
  try {
    await authenticate();
    // Optimized query to get user data
    const result = await query(
      'SELECT id, name, active, fullname, birthdate, gender FROM users ORDER BY name', 
      []
    );

    return sendJSON(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    const status = err.message === 'Unauthorized Access' ? 401 : 500;
    return sendJSON({ message: err.message }, status);
  }
}

// POST /api/users - create a new user
export async function POST(req) {
  let nameForError = "Unknown"; // Define outside try/catch for safe access

  try {
    const body = await req.json();
    const { name, active, fullname, birthdate, gender, password } = body;
    nameForError = name; // Store the name for the error message

    await authenticate();

    // The order here MUST match $1, $2, $3... in the SQL string
    const values = [
      name.trim(),       // $1
      active ?? true,    // $2
      fullname || null,  // $3
      birthdate || null, // $4
      gender || null,    // $5
      password           // $6
    ];

    const result = await query(
      `INSERT INTO users (name, active, fullname, birthdate, gender, password) 
       VALUES (UPPER($1), $2, $3, $4, $5, $6) 
       RETURNING id, name, active, birthdate, gender`,
      values
    );
   
    if (!result.rows || result.rows.length === 0) {
      return sendJSON({ message: "Failed to create user" }, 400);
    }

    return sendJSON(result.rows[0], 201);

  } catch (err) {
    console.error("API Error:", err); // Helpful for your server logs

    // Handle "unique_violation" (Duplicate Username)
    if (err.code === '23505') {
      return sendJSON({ 
        message: `The username "${nameForError}" is already taken.` 
      }, 409);
    }

    // Generic error fallback
    return sendJSON({ message: err.message || "An internal error occurred" }, 500);
  }
}