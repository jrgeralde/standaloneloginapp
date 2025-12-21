//app/api/roles/route.js
import { authenticate } from '@/middleware/auth';
import { authorizeUser } from '@/lib/permissions';
import { query } from '@/lib/db';

// Helper to handle responses consistently
const sendJSON = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};

export async function GET() {
  try {
    // 1. Authenticate (Checks JWT + Session Expiry)
    const user = await authenticate();

    // Check for user_id to match your middleware return { user_id: ... }
    if (!user || !user.user_id) {
      return sendJSON({ error: "Unauthorized login" }, 401);
    }

    // 2. Authorize 
    const isAllowed = await authorizeUser(user.user_id, ['ADMINISTRATOR', 'ROLES_CANACCESSROLES']);
    
    if (!isAllowed) {
      return sendJSON({ error: "Forbidden: Insufficient Permissions" }, 403);
    }

    const result = await query(
      'SELECT id, name, description FROM roles ORDER BY name', 
      []
    );
    
    return sendJSON(result.rows);

  } catch (error) {
    console.error("GET roles error:", error);
    return sendJSON({ error: "Internal Server Error" }, 500);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, description } = body;
   
    // 1. Authenticate
    const user = await authenticate();

    if (!user || !user.user_id) {
      return sendJSON({ error: 'Unauthorized Login' }, 401);
    }  

    // 2. Authorize
    const isAllowed = await authorizeUser(user.user_id, [
      'ADMINISTRATOR', 
      'ROLES_CANACCESSROLES',
      'ROLES_CANCREATEROLES'
    ]);

    if (!isAllowed) {
      return sendJSON({ error: "Forbidden: Insufficient Permissions" }, 403);
    }

    if (!name || typeof name !== 'string') {
      return sendJSON({ error: 'Role name is required.' }, 400);
    }

    const result = await query(
      'INSERT INTO roles (name, description) VALUES (UPPER($1), $2) RETURNING id, name, description',
      [name.trim(), description ?? null]
    );

    return sendJSON(result.rows[0], 201);

  } catch (err) {
    console.error('POST roles error:', err);
    
    if (err.code === '23505') {
      return sendJSON({ error: 'Role name must be unique' }, 409);
    }

    return sendJSON({ error: 'Internal Server Error'}, 500);
  }
}