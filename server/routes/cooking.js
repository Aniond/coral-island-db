const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/cooking[?buff=Fishing][?utensil=Oven]
// Returns cooking recipes (ingredients parsed), optionally filtered by buff or utensil.
router.get('/', async (req, res) => {
  const { buff, utensil } = req.query;
  try {
    let sql = 'SELECT * FROM cooking_recipes';
    const where = [];
    const params = [];
    if (buff)    { params.push(`${buff}%`); where.push(`buff ILIKE $${params.length}`); }
    if (utensil) { params.push(utensil);    where.push(`utensil = $${params.length}`); }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY name';

    const { rows } = await pool.query(sql, params);
    res.json(rows.map(r => ({ ...r, ingredients: safeParse(r.ingredients) })));
  } catch (err) {
    console.error('GET /api/cooking failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch cooking recipes' });
  }
});

// ingredients is JSONB (arrives parsed) on freshly-seeded DBs, but a JSON
// string on DBs seeded before the type change — handle both.
function safeParse(v) {
  if (Array.isArray(v)) return v;
  try { return JSON.parse(v) || []; } catch { return []; }
}

module.exports = router;
