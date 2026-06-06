const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/caves?cave=&item_type=
router.get('/', async (req, res) => {
  try {
    const { cave, item_type } = req.query;
    const where = [];
    const params = [];

    if (cave) {
      params.push(cave);
      where.push(`cave = $${params.length}`);
    }
    if (item_type) {
      params.push(item_type);
      where.push(`item_type = $${params.length}`);
    }

    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const { rows } = await pool.query(`SELECT * FROM cave_items ${clause} ORDER BY id`, params);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/caves failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch cave items' });
  }
});

module.exports = router;
