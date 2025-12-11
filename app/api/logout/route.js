import { query } from '../../../lib/db';

export async function POST(req) {
  try {
    // Read the Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ message: 'No token provided' }),
        { status: 400 }
      );
    }

    // Extract the token from "Bearer <token>"
    const token = authHeader.split(' ')[1];
    if (!token) {
      return new Response(
        JSON.stringify({ message: 'Invalid token format' }),
        { status: 400 }
      );
    }

    // Remove the session from the database
    await query('DELETE FROM sessions WHERE token = $1', [token]);

    return new Response(
      JSON.stringify({ message: 'Logged out successfully' }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Logout error:', error);

    return new Response(
      JSON.stringify({ message: 'Server error during logout' }),
      { status: 500 }
    );
  }
}
