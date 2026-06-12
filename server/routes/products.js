const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/animal', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM animal_products ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error('GET /api/products/animal failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch animal products' });
  }
});

router.get('/artisan', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM artisan_products ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error('GET /api/products/artisan failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch artisan products' });
  }
});

module.exports = router;
