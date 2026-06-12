const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM goddess_offerings ORDER BY altar_name, bundle_name, item_name');
    res.json(rows);
  } catch (err) {
    console.error('GET /api/offerings failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch offerings' });
  }
});

module.exports = router;
