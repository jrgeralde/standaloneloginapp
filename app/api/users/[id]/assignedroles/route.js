// app/api/users/[id]/assignedroles/route.js

import { query } from '@/lib/db';
import { authenticate, extractId } from '@/middleware/auth';
import { NextResponse } from 'next/server';

// 1. GET: Fetch current roles for a user
export async function GET(request, { params }) {
  try {
    await authenticate(); 
    const targetUserId = await extractId(request, params);

    if (!targetUserId) {
      return NextResponse.json({ error: 'Invalid User ID' }, { status: 400 });
    }

    const sqlText = `
      SELECT r.id, r.name AS role_name, r.description 
      FROM public.roles r
      INNER JOIN public.usersroles ur ON r.id = ur.roleid
      WHERE ur.userid = $1
      ORDER BY r.name ASC;
    `;

    const result = await query(sqlText, [targetUserId]);
    return NextResponse.json(result.rows);

  } catch (error) {
    console.error('Database Error (GET):', error);
    return NextResponse.json({ error: 'Internal Database Server Error' }, { status: 500 });
  }
}

// 2. POST: Add a role to a user
export async function POST(request, { params }) {
  try {
    await authenticate();
    const targetUserId = await extractId(request, params);
    const { roleId } = await request.json();

    if (!targetUserId || !roleId) {
      return NextResponse.json({ error: 'User ID and Role ID required' }, { status: 400 });
    }

    const sqlText = `
      INSERT INTO public.usersroles (userid, roleid)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING;
    `;

    await query(sqlText, [targetUserId, roleId]);
    return NextResponse.json({ message: 'Role assigned successfully' });

  } catch (error) {
    console.error('Database Error (POST):', error);
    return NextResponse.json({ error: 'Internal Database Server Error' }, { status: 500 });
  }
}

// 3. DELETE: Remove a role from a user
// Note: If you want to use /api/users/[id]/assignedroles/[roleId], 
// you would need a separate route file. 
// For this single file, we can accept roleId in the body or searchParams.
export async function DELETE(request, { params }) {
  try {
    await authenticate();
    const targetUserId = await extractId(request, params);
    
    // Getting roleId from URL search params (e.g., .../assignedroles?roleId=5)
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('roleId');

    if (!targetUserId || !roleId) {
      return NextResponse.json({ error: 'User ID and Role ID required' }, { status: 400 });
    }

    const sqlText = `
      DELETE FROM public.usersroles 
      WHERE userid = $1 AND roleid = $2;
    `;

    await query(sqlText, [targetUserId, roleId]);
    return NextResponse.json({ message: 'Role removed successfully' });

  } catch (error) {
    console.error('Database Error (DELETE):', error);
    return NextResponse.json({ error: 'Internal Database Server Error' }, { status: 500 });
  }
}