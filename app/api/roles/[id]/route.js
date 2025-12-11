import { query } from '../../../../lib/db';
import { authenticate } from '../../../../middleware/auth';

const parseId = (value) => {
  const cleaned = typeof value === 'string' ? value.trim() : value;
  const id = Number(cleaned);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const extractId = (req, params) => {
  const fromParams = params?.id;
  if (fromParams !== undefined) {
    const parsed = parseId(fromParams);
    if (parsed) return parsed;
  }
  const url = new URL(req.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1];
  return parseId(last);
};

// GET /api/roles/[id] - fetch single role
export async function GET(req, { params }) {
  //const id = parseId(params.id);
  const id = extractId(req, params);
  if (!id) {
    return new Response(JSON.stringify({ message: 'Invalid role id' }), {
      status: 400,
    });
  }

  try {
    await authenticate(req, new Response());

    const result = await query(
      'SELECT id, name, description FROM roles WHERE id = $1',
      [id]
    );

    if (!result.rows.length) {
      return new Response(JSON.stringify({ message: 'Role not found' }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(result.rows[0]), { status: 200 });
  } catch (err) {
    console.error('Error fetching role:', err);
    return new Response(
      JSON.stringify({ message: 'Server error while fetching role' }),
      { status: 500 }
    );
  }
}

// PATCH /api/roles/[id] - update role
export async function PATCH(req, { params }) {
  //const id = parseId(params.id);
  const id = extractId(req, params);

  if (!id) {
    return new Response(JSON.stringify({ message: 'Invalid role id:'+id }), {
      status: 400,
    });
  }

  try {
    await authenticate(req, new Response());

    const { name, description } = await req.json();
    const updates = [];
    const values = [];
    let index = 1;

    if (name !== undefined) {
      if (!name || typeof name !== 'string') {
        return new Response(
          JSON.stringify({ message: 'Role name must be a non-empty string' }),
          { status: 400 }
        );
      }
      updates.push(`name = $${index++}`);
      values.push(name.trim());
    }

    if (description !== undefined) {
      updates.push(`description = $${index++}`);
      values.push(description ?? null);
    }

    if (!updates.length) {
      return new Response(
        JSON.stringify({ message: 'No fields provided to update' }),
        { status: 400 }
      );
    }

    values.push(id);
    const queryText = `UPDATE roles SET ${updates.join(
      ', '
    )} WHERE id = $${index} RETURNING id, name, description`;

    const result = await query(queryText, values);

    if (!result.rows.length) {
      return new Response(JSON.stringify({ message: 'Role not found' }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(result.rows[0]), { status: 200 });
  } catch (err) {
    console.error('Error updating role:', err);

    if (err.code === '23505') {
      return new Response(
        JSON.stringify({ message: 'Role name must be unique' }),
        { status: 409 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Server error while updating role' }),
      { status: 500 }
    );
  }
}

// DELETE /api/roles/[id] - delete role
export async function DELETE(req, { params }) {
  const id = extractId(req, params);
  if (!id) {
    return new Response(JSON.stringify({ message: 'Invalid role id' }), {
      status: 400,
    });
  }

  try {
    await authenticate(req, new Response());

    const result = await query('DELETE FROM roles WHERE id = $1 RETURNING id', [
      id,
    ]);

    if (!result.rows.length) {
      return new Response(JSON.stringify({ message: 'Role not found' }), {
        status: 404,
      });
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('Error deleting role:', err);
    return new Response(
      JSON.stringify({ message: 'Server error while deleting role' }),
      { status: 500 }
    );
  }
}

