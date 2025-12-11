import { query } from '../../../lib/db';
import { authenticate } from '../../../middleware/auth';

// GET /api/roles - list all roles
export async function GET(req) {
  try {
    await authenticate(req, new Response());

    const result = await query(
      'SELECT id, name, description FROM roles ORDER BY id',
      []
    );

    return new Response(JSON.stringify(result.rows), { status: 200 });
  } catch (err) {
    console.error('Error fetching roles:', err);
    return new Response(
      JSON.stringify({ message: 'Server error while fetching roles' }),
      { status: 500 }
    );
  }
}

// POST /api/roles - create a role
export async function POST(req) {
  try {
    await authenticate(req, new Response());

    const { name, description } = await req.json();

    if (!name || typeof name !== 'string') {
      return new Response(
        JSON.stringify({ message: 'Role name is required' }),
        { status: 400 }
      );
    }

    const result = await query(
      'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id, name, description',
      [name.trim(), description ?? null]
    );

    return new Response(JSON.stringify(result.rows[0]), { status: 201 });
  } catch (err) {
    console.error('Error creating role:', err);

    if (err.code === '23505') {
      return new Response(
        JSON.stringify({ message: 'Role name must be unique' }),
        { status: 409 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Server error while creating role' }),
      { status: 500 }
    );
  }
}
