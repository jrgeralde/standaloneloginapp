import { query } from '../../../lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  const { name, password } = await req.json();

  try {
    // Get user by name
    const userResult = await query(
      'SELECT id, name, password, active FROM users WHERE name = $1',
      [name]
    );
    const user = userResult.rows[0];

    if (!user) {
      return new Response(
        JSON.stringify({ message: 'Invalid credentials' }),
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.active) {
      return new Response(
        JSON.stringify({ message: 'Error: Your account is deactivated. Contact Administrator' }),
        { status: 403 }
      );
    }

    // Compare passwords
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return new Response(
        JSON.stringify({ message: 'Invalid credentials' }),
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '2d' }
    );

    // Save session
    await query(
      'INSERT INTO sessions (user_id, token, last_activity) VALUES ($1, $2, NOW())',
      [user.id, token]
    );

    return new Response(JSON.stringify({ token }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ message: 'Server error' }),
      { status: 500 }
    );
  }
}
