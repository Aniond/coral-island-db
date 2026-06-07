const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/collectibles[?category=fish]
// Returns museum/journal collectibles, optionally filtered by category.
router.get('/', async (req, res) => {
  const { category } = req.query;
  try {
    const { rows } = category
      ? await pool.query('SELECT * FROM collectibles WHERE category = $1 ORDER BY sort_order, name', [category])
      : await pool.query('SELECT * FROM collectibles ORDER BY category, sort_order, name');
    res.json(rows);
  } catch (err) {
    console.error('GET /api/collectibles failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch collectibles' });
  }
});

module.exports = router;
