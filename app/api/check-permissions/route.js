// app/api/check-permissions/route.js
import { authenticate } from '@/middleware/auth';
import { authorizeUser } from '@/lib/permissions';

const sendJSON = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};


export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const requiredRoles = searchParams.getAll('roles'); // e.g., ['ADMINISTRATOR']

    // 1. Authenticate (Checks JWT + Session Expiry)
    const user = await authenticate();

    // Check for user_id to match your middleware return { user_id: ... }
    if (!user || !user.user_id) {
      return sendJSON({ error: "Unauthorized login" }, 401);
    }

    // 2. Fetch the user's actual roles from your 'usersroles' table
    const authorized = await authorizeUser(user.user_id, requiredRoles);

    
    return sendJSON({isallowed:authorized}, 201);
}