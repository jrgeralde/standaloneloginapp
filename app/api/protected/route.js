//app/api/protected/route.js
import { authenticate } from '../../../middleware/auth';

export async function GET(req) {
  const res = new Response();
  try {
    await authenticate(req, res);
    return new Response(JSON.stringify({ email: req.user.email, userId: req.user.userId }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }
}
