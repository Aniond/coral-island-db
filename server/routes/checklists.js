const express = require('express');
const router = express.Router();
const pool = require('../db');
const supabase = require('../lib/supabase');

// Middleware to authenticate user
async function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
  if (!token) {
    return res.status(401).json({ error: 'Sign in to use checklists' });
  }
  try {
    const { data, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    req.user = data.user;
    next();
  } catch (err) {
    console.error('Auth check failed:', err.message);
    return res.status(500).json({ error: 'Auth service unavailable' });
  }
}

// GET /api/checklists -> returns user's checklist
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT tasks FROM user_checklists WHERE user_id = $1',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.json({ tasks: [] });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/checklists failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch checklist' });
  }
});

// POST /api/checklists -> updates user's checklist
router.post('/', requireAuth, async (req, res) => {
  const { tasks } = req.body;
  if (!Array.isArray(tasks)) {
    return res.status(400).json({ error: 'Tasks must be an array' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO user_checklists (user_id, tasks) 
       VALUES ($1, $2) 
       ON CONFLICT (user_id) 
       DO UPDATE SET tasks = EXCLUDED.tasks 
       RETURNING tasks`,
      [req.user.id, JSON.stringify(tasks)]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('POST /api/checklists failed:', err.message);
    res.status(500).json({ error: 'Failed to save checklist' });
  }
});

module.exports = router;
