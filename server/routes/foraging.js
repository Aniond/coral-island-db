const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/forageables?season=&area=
// "all"-season forageables pass any season filter (they appear year-round).
router.get('/', async (req, res) => {
  try {
    const { season, area } = req.query;
    const where = [];
    const params = [];

    if (season) {
      params.push(season);
      where.push(`(season = $${params.length} OR season = 'all')`);
    }
    if (area) {
      params.push(area);
      where.push(`area = $${params.length}`);
    }

    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const { rows } = await pool.query(`SELECT * FROM forageables ${clause} ORDER BY id`, params);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/forageables failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch forageables' });
  }
});

module.exports = router;
