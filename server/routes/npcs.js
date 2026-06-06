const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/npcs — returns all NPCs.
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM npcs ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error('GET /api/npcs failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch NPCs' });
  }
});

module.exports = router;
