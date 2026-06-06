const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/crops?season=&town_rank=&type=
// All params optional; WHERE clauses added only when provided.
// season uses partial match so multi-season rows (e.g. "summer/fall") and
// "all"-season crops surface for a single-season query.
router.get('/', async (req, res) => {
  try {
    const { season, town_rank, type } = req.query;
    const where = [];
    const params = [];

    if (season) {
      params.push(season);
      where.push(`(season ILIKE '%' || $${params.length} || '%' OR season = 'all')`);
    }
    if (town_rank) {
      params.push(town_rank);
      where.push(`town_rank = $${params.length}`);
    }
    if (type) {
      params.push(type);
      where.push(`type = $${params.length}`);
    }

    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const { rows } = await pool.query(`SELECT * FROM crops ${clause} ORDER BY id`, params);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/crops failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch crops' });
  }
});

module.exports = router;
