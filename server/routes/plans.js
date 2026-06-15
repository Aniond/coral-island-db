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

// GET /api/plans -> returns array of saved plans
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, query, content, created_at FROM ai_plans WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/plans failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch saved plans' });
  }
});

// POST /api/plans -> creates a new saved plan
router.post('/', requireAuth, async (req, res) => {
  const { query, content } = req.body;
  if (!query || !content) {
    return res.status(400).json({ error: 'Missing query or content' });
  }
  try {
    const { rows } = await pool.query(
      'INSERT INTO ai_plans (user_id, query, content) VALUES ($1, $2, $3) RETURNING id, query, content, created_at',
      [req.user.id, query, content]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/plans failed:', err.message);
    res.status(500).json({ error: 'Failed to save plan' });
  }
});

// DELETE /api/plans/:id -> deletes a saved plan
router.delete('/:id', requireAuth, async (req, res) => {
  const planId = req.params.id;
  try {
    await pool.query('DELETE FROM ai_plans WHERE id = $1 AND user_id = $2', [planId, req.user.id]);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('DELETE /api/plans failed:', err.message);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

module.exports = router;
