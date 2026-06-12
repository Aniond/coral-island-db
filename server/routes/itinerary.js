const express = require('express');
const router = express.Router();
const pool = require('../db');
const supabase = require('../lib/supabase');

// Middleware to authenticate user
async function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
  if (!token) return res.status(401).json({ error: 'Sign in required' });
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return res.status(401).json({ error: 'Invalid or expired session' });
    req.user = data.user;
    next();
  } catch (err) {
    console.error('Auth check failed:', err.message);
    return res.status(500).json({ error: 'Auth service unavailable' });
  }
}

/**
 * GET /api/itinerary
 * Query params: season (string), day (number), weather (string), townRank (string)
 */
router.get('/', requireAuth, async (req, res) => {
  const { season, day, weather, townRank } = req.query;
  if (!season || !day) {
    return res.status(400).json({ error: 'Missing season or day' });
  }

  try {
    const s = String(season).trim();
    const d = String(day).trim();
    
    // 1. Find Birthdays
    const birthdayQuery = `${s} ${d}`;
    const { rows: npcs } = await pool.query(
      `SELECT name, role, location, loved_gifts 
       FROM npcs 
       WHERE birthday ILIKE $1`,
      [`%${birthdayQuery}%`]
    );

    // 2. Fetch Incomplete Offerings
    const { rows: incomplete } = await pool.query(
      `SELECT o.altar_name, o.bundle_name, o.item_name, o.amount, o.quality
       FROM goddess_offerings o
       WHERE NOT EXISTS (
         SELECT 1 FROM user_offerings u 
         WHERE u.user_id = $1 AND u.item_name = o.item_name
       )`,
      [req.user.id]
    );

    const itemNames = incomplete.map(i => i.item_name);
    let availableOfferings = [];

    if (itemNames.length > 0) {
      // 3. Cross-Reference Sources
      // We query forageables, collectibles, and crops for these items.
      
      const { rows: forageables } = await pool.query(
        `SELECT name, location, area, season 
         FROM forageables 
         WHERE name = ANY($1) AND (season ILIKE $2 OR season ILIKE '%all%')`,
        [itemNames, `%${s}%`]
      );

      const { rows: collectibles } = await pool.query(
        `SELECT name, category, locations, time_of_day, seasons 
         FROM collectibles 
         WHERE name = ANY($1) AND (seasons ILIKE $2 OR seasons ILIKE '%all%')`,
        [itemNames, `%${s}%`]
      );

      const { rows: crops } = await pool.query(
        `SELECT name, type, season, town_rank 
         FROM crops 
         WHERE name = ANY($1) AND (season ILIKE $2 OR season ILIKE '%all%')`,
        [itemNames, `%${s}%`]
      );

      // Map everything back to the offerings
      for (const off of incomplete) {
        // Find if this item is available today
        const f = forageables.find(x => x.name === off.item_name);
        const c = collectibles.find(x => x.name === off.item_name);
        const cr = crops.find(x => x.name === off.item_name);

        if (f) {
          availableOfferings.push({
            bundle: off.bundle_name,
            item: off.item_name,
            sourceType: 'Forageable',
            location: `${f.location} (${f.area})`,
            time: 'Any time'
          });
        } else if (c) {
          availableOfferings.push({
            bundle: off.bundle_name,
            item: off.item_name,
            sourceType: c.category, // e.g. 'fish', 'insect'
            location: c.locations,
            time: c.time_of_day
          });
        } else if (cr) {
          availableOfferings.push({
            bundle: off.bundle_name,
            item: off.item_name,
            sourceType: 'Crop',
            location: `Farm (Seed requires Town Rank ${cr.town_rank})`,
            time: 'Any time'
          });
        }
      }
    }

    // 4. Return Structured JSON Itinerary
    const response = {
      date: { season: s, day: d, weather: weather || 'Sunny', townRank: townRank || 'F' },
      birthdays: npcs.map(n => ({
        name: n.name,
        role: n.role,
        location: n.location,
        lovedGifts: n.loved_gifts
      })),
      offeringsToGather: availableOfferings
    };

    res.json(response);
  } catch (err) {
    console.error('GET /api/itinerary failed:', err.message);
    res.status(500).json({ error: 'Failed to generate itinerary' });
  }
});

/**
 * POST /api/itinerary/offerings
 * Mark an offering as completed
 */
router.post('/offerings', requireAuth, async (req, res) => {
  const { itemName } = req.body;
  if (!itemName) return res.status(400).json({ error: 'Missing itemName' });

  try {
    await pool.query(
      `INSERT INTO user_offerings (user_id, item_name) 
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [req.user.id, itemName]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/itinerary/offerings failed:', err.message);
    res.status(500).json({ error: 'Failed to mark offering complete' });
  }
});

module.exports = router;
