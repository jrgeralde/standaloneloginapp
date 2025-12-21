import { query } from '../../../lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { name, password } = await req.json();

    // Get user by name
    const userResult = await query(
      'SELECT id, name, password, active FROM users WHERE name = $1',
      [name]
    );
    const user = userResult.rows[0];

    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    if (!user.active) {
      return NextResponse.json(
        { message: 'Your account is deactivated. Contact Administrator' },
        { status: 403 }
      );
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '2d' }
    );

    // Save DB session
    await query(
      'INSERT INTO sessions (user_id, token, last_activity) VALUES ($1, $2, NOW())',
      [user.id, token]
    );

    // Set HttpOnly cookie via NextResponse
    const res = NextResponse.json({ 
      message: 'Login successful',
      user: {
        userid: user.id,      // Included from DB
        username: user.name   // Included from DB
      }
    });
    
    res.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 2, // 2 days
    });

    return res;

  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
