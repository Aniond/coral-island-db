const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/crafting[?category=Farming]
// Returns crafting recipes (ingredients parsed from JSON), optionally filtered.
router.get('/', async (req, res) => {
  const { category } = req.query;
  try {
    const { rows } = category
      ? await pool.query('SELECT * FROM crafting_recipes WHERE category = $1 ORDER BY name', [category])
      : await pool.query('SELECT * FROM crafting_recipes ORDER BY category, name');
    const recipes = rows.map(r => ({
      ...r,
      ingredients: safeParse(r.ingredients),
    }));
    res.json(recipes);
  } catch (err) {
    console.error('GET /api/crafting failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch crafting recipes' });
  }
});

// ingredients is JSONB (arrives parsed) on freshly-seeded DBs, but a JSON
// string on DBs seeded before the type change — handle both.
function safeParse(v) {
  if (Array.isArray(v)) return v;
  try { return JSON.parse(v) || []; } catch { return []; }
}

module.exports = router;
