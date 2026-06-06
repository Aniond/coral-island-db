const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/requireAuth');
const supabase = require('../lib/supabase');

// GET /api/admin/me  — lightweight role check (used by AuthContext on login)
router.get('/me', requireAuth, (req, res) => {
  res.json({ isAdmin: req.isAdmin });
});

// GET /api/admin/stats
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [usersRes, adminsRes, searchesRes, todayRes] = await Promise.all([
      // Supabase lists all auth users via admin API
      supabase.auth.admin.listUsers({ perPage: 1 }),
      pool.query("SELECT COUNT(*) FROM user_roles WHERE role = 'admin'"),
      pool.query('SELECT COUNT(*) FROM search_logs'),
      pool.query("SELECT COUNT(*) FROM search_logs WHERE created_at >= CURRENT_DATE"),
    ]);

    res.json({
      totalUsers:    usersRes.data?.total ?? null,
      totalAdmins:   parseInt(adminsRes.rows[0].count, 10),
      totalSearches: parseInt(searchesRes.rows[0].count, 10),
      searchesToday: parseInt(todayRes.rows[0].count, 10),
    });
  } catch (err) {
    console.error('GET /api/admin/stats failed:', err.message);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// GET /api/admin/users  — full user list with roles
router.get('/users', requireAdmin, async (req, res) => {
  try {
    // Fetch all auth users (paginated up to 1000 for now)
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw error;

    const { rows: roleRows } = await pool.query('SELECT user_id, role FROM user_roles');
    const roleMap = Object.fromEntries(roleRows.map(r => [r.user_id, r.role]));

    const users = (data.users || []).map(u => ({
      id:        u.id,
      email:     u.email,
      role:      roleMap[u.id] || 'user',
      createdAt: u.created_at,
    }));

    res.json(users);
  } catch (err) {
    console.error('GET /api/admin/users failed:', err.message);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

// PATCH /api/admin/users/:id/role  { role: 'admin' | 'user' }
router.patch('/users/:id/role', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ error: 'role must be "admin" or "user"' });
  }

  // Prevent self-demotion
  if (id === req.user.id) {
    return res.status(400).json({ error: 'Cannot change your own role' });
  }

  try {
    // Get user email from Supabase for the user_roles record
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(id);
    if (userError) throw userError;
    const email = userData?.user?.email || '';

    if (role === 'admin') {
      await pool.query(
        `INSERT INTO user_roles (user_id, role, email, created_at)
         VALUES ($1, 'admin', $2, NOW())
         ON CONFLICT (user_id) DO UPDATE SET role = 'admin', email = $2`,
        [id, email],
      );
    } else {
      await pool.query('DELETE FROM user_roles WHERE user_id = $1', [id]);
    }

    res.json({ ok: true, role });
  } catch (err) {
    console.error('PATCH /api/admin/users/:id/role failed:', err.message);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// GET /api/admin/search-logs?page=1&limit=20
router.get('/search-logs', requireAdmin, async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page  || '1',  10));
  const limit = Math.min(100, parseInt(req.query.limit || '20', 10));
  const offset = (page - 1) * limit;

  try {
    const [logsRes, countRes] = await Promise.all([
      pool.query(
        `SELECT sl.id, sl.user_id, sl.query, sl.created_at,
                ur.email AS user_email
         FROM search_logs sl
         LEFT JOIN user_roles ur ON ur.user_id = sl.user_id
         ORDER BY sl.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
      pool.query('SELECT COUNT(*) FROM search_logs'),
    ]);

    res.json({
      logs: logsRes.rows.map(r => ({
        id:        r.id,
        userId:    r.user_id,
        userEmail: r.user_email || null,
        query:     r.query,
        createdAt: r.created_at,
      })),
      total: parseInt(countRes.rows[0].count, 10),
      page,
      limit,
    });
  } catch (err) {
    console.error('GET /api/admin/search-logs failed:', err.message);
    res.status(500).json({ error: 'Failed to load search logs' });
  }
});

module.exports = router;
