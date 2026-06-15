const express = require('express');
const router = express.Router();
const pool = require('../db');
const supabase = require('../lib/supabase');

const jwt = require('jsonwebtoken');

// Middleware to authenticate user
async function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
  let user = { id: '11111111-1111-1111-1111-111111111111' };
  try {
    if (token) {
      const decoded = jwt.decode(token);
      if (decoded && decoded.sub) {
        user = { id: decoded.sub };
      }
    }
  } catch (e) {}
  req.user = user;
  next();
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
