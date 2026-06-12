const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tools ORDER BY tool_type, tier');
    res.json(rows);
  } catch (err) {
    console.error('GET /api/tools failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch tools' });
  }
});

module.exports = router;
