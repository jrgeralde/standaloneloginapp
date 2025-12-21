import { query } from '../../../lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
  
    // Get token from cookies
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 400 });
    }

    // Remove session from DB
    await query('DELETE FROM sessions WHERE token = $1', [token]);

    // Delete cookie using NextResponse
    const res = NextResponse.json({ message: 'Logged out successfully' });
    res.cookies.delete('token', { path: '/' });

    return res;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: 'Server error during logout' },
      { status: 500 }
    );
  }
}
