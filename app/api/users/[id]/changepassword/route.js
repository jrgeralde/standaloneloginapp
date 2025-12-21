//app/api/users/[id]/changepassword/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params; // Captures ID from URL
    const { newPassword } = await request.json();

    if (!newPassword) {
      return NextResponse.json({ message: 'New password is required' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    // We parse the ID to ensure it matches the integer type in Postgres
    await query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashed, parseInt(id, 10)]
    );

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password Update Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}