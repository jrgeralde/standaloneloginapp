import { query } from '../../../../lib/db';
import { authenticate,extractId } from '../../../../middleware/auth';


// GET /api/roles/[id] - fetch single user
export async function GET(req, { params }) {
  // 1. MUST await extractId because it's async in your auth.js
  const id = await extractId(req, params);

  if (!id) {
    return new Response(JSON.stringify({ message: 'Invalid user id' }), {
      status: 400,
    });
  }

  try {
    // 2. authenticate() doesn't need the Response object passed in
    // based on the function you showed me earlier.
    await authenticate(); 

    const result = await query(
      'SELECT id, name, active, fullname, birthdate, gender, photo FROM users WHERE id = $1',
      [id]
    );

    if (!result.rows.length) {
      return new Response(JSON.stringify({ message: 'User not found' }), {
        status: 404,
      });
    }

    const user = result.rows[0];

    // 3. Optional: If photo is binary data (Buffer), convert to Base64
    if (user.photo && Buffer.isBuffer(user.photo)) {
      user.photo = `data:image/jpeg;base64,${user.photo.toString('base64')}`;
    }

    return new Response(JSON.stringify(user), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    // If authenticate() throws "Unauthorized Access", this catch block catches it
    const status = err.message === 'Unauthorized Access' ? 401 : 500;
    
    return new Response(
      JSON.stringify({ message: err.message || 'Server error' }),
      { status }
    );
  }
}

// PATCH /api/users/[id] - update user
export async function PATCH(req, { params }) {
  const targetId = await extractId(req, params);
  
  try {
    await authenticate();
    const { name, fullname, birthdate, gender } = await req.json();

    const result = await query(
      `UPDATE users 
       SET name = UPPER($1), fullname = $2, birthdate = $3, gender = $4
       WHERE id = $5 
       RETURNING id, name`,
      [name.trim(), fullname || null, birthdate || null, gender || null, targetId]
    );

    if (result.rows.length === 0) {
      return new Response(JSON.stringify({ message: 'User not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: 'Updated', user: result.rows[0] }));
  } catch (err) {
    // Catch duplication specifically for the 'name' column
    if (err.code === '23505') {
      return new Response(
        JSON.stringify({ message: 'This username is already in use by another account.' }), 
        { status: 409 }
      );
    }
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}

// DELETE /api/users/[id] - delete user
export async function DELETE(req, { params }) {
  const id = await extractId(req, params);
  if (!id) {
    return new Response(JSON.stringify({ message: 'Invalid user id' }), {
      status: 400,
    });
  }

  try {
    await authenticate(req, new Response());

    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [
      id,
    ]);

    if (!result.rows.length) {
      return new Response(JSON.stringify({ message: 'User not found' }), {
        status: 404,
      });
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('Error deleting user:', err);
    return new Response(
      JSON.stringify({ message: 'Server error while deleting User' }),
      { status: 500 }
    );
  }
}

// PUT /api/users/[id]/toggle
export async function PUT(req, { params }) {
  const id = await extractId(req, params);

  if (!id) {
    return new Response(JSON.stringify({ message: 'Invalid user id' }), {
      status: 400,
    });
  }

  try {
    // 1. Verify session/permissions
    await authenticate(req, new Response());

    // 2. Perform the toggle in a single atomic SQL command
    // Using NOT active flips true -> false and false -> true
    const result = await query(
      `UPDATE users 
       SET active = NOT active 
       WHERE id = $1 
       RETURNING id, name, active`,
      [id]
    );

    if (result.rows.length === 0) {
      return new Response(JSON.stringify({ message: 'User not found' }), {
        status: 404,
      });
    }

    const updatedUser = result.rows[0];

    return new Response(
      JSON.stringify({
        message: `User ${updatedUser.active ? 'activated' : 'deactivated'}`,
        user: updatedUser,
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (err) {
    console.error('Error toggling user status:', err);
    
    const status = err.message === 'Unauthorized Access' ? 401 : 500;
    return new Response(
      JSON.stringify({ message: err.message || 'Server error' }),
      { status }
    );
  }
}


