// app/api/users/[id]/availableroles/route.js
import { query } from '@/lib/db';
import { authenticate, extractId } from '@/middleware/auth';
import { NextResponse } from 'next/server';

// 1. GET: Fetch roles NOT yet assigned to the user
export async function GET(request, { params }) {
  try {
    await authenticate(); 
    const targetUserId = await extractId(request, params);

    if (!targetUserId) {
      return NextResponse.json({ error: 'Invalid User ID' }, { status: 400 });
    }

    const sqlText = `
      SELECT id, name AS role_name, description 
      FROM public.roles
      WHERE id NOT IN (
        SELECT roleid FROM public.usersroles WHERE userid = $1
      )
      ORDER BY name ASC;
    `;

    const result = await query(sqlText, [targetUserId]);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Internal Database Server Error' }, { status: 500 });
  }
}

// 2. POST: Add specific roles OR all available roles
export async function POST(request, { params }) {
  try {
    await authenticate();
    const targetUserId = await extractId(request, params);
    const body = await request.json().catch(() => ({})); // Handle empty body
    const { roleIds } = body; // Get filtered IDs from frontend

    if (!targetUserId) {
      return NextResponse.json({ error: 'Invalid User ID' }, { status: 400 });
    }

    let sqlText;
    let values;

    if (roleIds && Array.isArray(roleIds) && roleIds.length > 0) {
      // Logic: Insert only the specific IDs passed from the filtered list
      sqlText = `
        INSERT INTO public.usersroles (userid, roleid)
        SELECT $1, unnest($2::int[])
        ON CONFLICT DO NOTHING;
      `;
      values = [targetUserId, roleIds];
    } else {
      // Fallback: Original logic to add everything
      sqlText = `
        INSERT INTO public.usersroles (userid, roleid)
        SELECT $1, id FROM public.roles
        WHERE id NOT IN (SELECT roleid FROM public.usersroles WHERE userid = $1)
        ON CONFLICT DO NOTHING;
      `;
      values = [targetUserId];
    }

    await query(sqlText, values);
    return NextResponse.json({ message: 'Roles assigned successfully' });
  } catch (error) {
    console.error('Add Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// 3. DELETE: Remove specific roles OR all assigned roles
export async function DELETE(request, { params }) {
  try {
    await authenticate();
    const targetUserId = await extractId(request, params);
    const body = await request.json().catch(() => ({}));
    const { roleIds } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'Invalid User ID' }, { status: 400 });
    }

    let sqlText;
    let values;

    if (roleIds && Array.isArray(roleIds) && roleIds.length > 0) {
      sqlText = `DELETE FROM public.usersroles WHERE userid = $1 AND roleid = ANY($2::int[])`;
      values = [targetUserId, roleIds];
    } else {
      sqlText = `DELETE FROM public.usersroles WHERE userid = $1`;
      values = [targetUserId];
    }

    await query(sqlText, values);
    return NextResponse.json({ message: 'Roles removed successfully' });
  } catch (error) {
    console.error('Remove Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}