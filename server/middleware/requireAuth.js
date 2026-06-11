const supabase = require('../lib/supabase');
const pool = require('../db');

// Verifies the Supabase JWT and attaches req.user + req.isAdmin.
async function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
  if (!token) return res.status(401).json({ error: 'Unauthorised' });

  let user;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return res.status(401).json({ error: 'Invalid token' });
    user = data.user;
  } catch (err) {
    // e.g. Supabase env vars missing — fail this request, not the process
    console.error('requireAuth failed:', err.message);
    return res.status(500).json({ error: 'Auth service unavailable' });
  }

  req.user = user;
  req.authToken = token;

  try {
    const { rows } = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = $1',
      [user.id],
    );
    req.isAdmin = rows.length > 0 && rows[0].role === 'admin';
  } catch {
    req.isAdmin = false;
  }

  next();
}

async function requireAdmin(req, res, next) {
  await requireAuth(req, res, async () => {
    if (!req.isAdmin) return res.status(403).json({ error: 'Forbidden' });
    next();
  });
}

module.exports = { requireAuth, requireAdmin };
