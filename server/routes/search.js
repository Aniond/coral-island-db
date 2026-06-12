const express = require('express');
const router = express.Router();
const pool = require('../db');
const supabase = require('../lib/supabase');
const { getSearchLimits } = require('../lib/settings');
const rateLimit = require('express-rate-limit');

const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per `window` (here, per 1 minute)
  message: { error: 'Too many requests. Please wait a minute before asking another question.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const { GoogleGenAI } = require('@google/genai');

const MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT =
  'You are an expert guide for the farming game Coral Island. ' +
  'Use the provided game database context to answer questions accurately and helpfully. ' +
  'Follow these formatting rules strictly:\n' +
  '- Never start your response with a blank or empty heading.\n' +
  '- Start directly with content — either a sentence, a heading with text, or a bullet list.\n' +
  '- Use ## for main section headings, ### for sub-sections. Always include text after # symbols.\n' +
  '- Use markdown tables for comparisons or lists of items with multiple attributes.\n' +
  '- Use bullet points for simple lists.\n' +
  '- End with a short tip or note in a > blockquote only when genuinely useful.\n' +
  '- Be concise. Avoid filler phrases like "Great question!" or "I hope this helps!".\n' +
  '\n' +
  'When the user asks how to craft, make, or build something (or asks about a recipe), produce a full "recipe page":\n' +
  '1. Start with a ## heading of the item name, then a one-line description if available.\n' +
  '2. State how many it makes, where it is crafted (default to the Crafting Bench/Workbench unless clearly an ' +
  'artisan machine), and any crafting unlock requirement (mastery skill + level).\n' +
  '3. Add an "### Ingredients" markdown table with columns: Ingredient | Qty | Where to get it | Tool. ' +
  'For "Where to get it", CROSS-REFERENCE the database — a crop\'s season & town rank, a forageable\'s season & area, ' +
  'a fish\'s season/location/time, a mined item\'s mine & floors, an artisan good\'s source. ' +
  'For "Tool", give the gathering tool needed to obtain that ingredient using these rules: ' +
  'fish → Fishing Pole; ore/gem/geode/stone → Pickaxe; insect/bug → Bug Net; sea critter → Diving gear (suit + net); ' +
  'wood/hardwood → Axe; crop → grown from seed (Scythe/hand); forageable → picked by hand. Use "—" if no tool applies.\n' +
  'If an ingredient is "Any X" (a generic category), say so and give 1-2 concrete examples from the database. ' +
  'If you genuinely cannot find a source in the context, write "—" rather than inventing one.\n' +
  '4. For COOKING recipes, also state the utensil used, the food buff (skill/stat bonus + duration), and HP/energy restored.\n' +
  '5. Optionally end with a short > blockquote tip (e.g. cheapest/easiest ingredient route).\n' +
  '\n' +
  'When the user asks about Goddess Offerings, Bundles, or Fairies, list the required items for the requested bundle. ' +
  'CROSS-REFERENCE the database to tell the user EXACTLY where to find those required items (season, location, mine floors, etc).\n' +
  '\n' +
  'When the user asks which food boosts a skill or stat (e.g. "what food increases Fishing"), list every matching dish ' +
  'in a markdown table: Dish | Buff | Utensil | Key ingredients. Note that proficiency buffs map to skills ' +
  '(Fishing, Mining, Farming, Foraging, Diving, Ranching, Catching). Sort strongest buff first.\n' +
  '\n' +
  'IMPORTANT: You have access to tools to modify the database. If the user explicitly states they donated, completed, ' +
  'or caught an item for a bundle, call `mark_offering_complete`. If they ask to be reminded of something, call `add_custom_task`.';

// Pull the whole database and render it as compact text for the model.
// Each table is fetched independently: a missing or failing table (e.g. a newly
// added one that hasn't been seeded into this DB yet) degrades that one section
// to empty rather than taking down the entire AI search.
async function buildContext() {
  const q = async (sql) => {
    try {
      return await pool.query(sql);
    } catch (e) {
      console.error('buildContext query failed:', e.message);
      return { rows: [] };
    }
  };
  const [crops, caves, forageables, npcs, collectibles, crafting, cooking, offerings, animals, artisan, tools] = await Promise.all([
    q('SELECT name, type, season, town_rank, grow_days, seed_price, sell_price, price_bronze, price_silver, price_gold, price_osmium, regrowth_days, notes FROM crops ORDER BY id'),
    q('SELECT cave, item_name, item_type, floor_range, notes FROM cave_items ORDER BY id'),
    q('SELECT name, season, location, area, notes, sell_price FROM forageables ORDER BY id'),
    q('SELECT name, role, location, schedule, loved_gifts, liked_gifts, quest_summary, birthday FROM npcs ORDER BY id'),
    q('SELECT category, name, sell_price, rarity, seasons, locations, time_of_day FROM collectibles ORDER BY category, sort_order'),
    q('SELECT name, output_amount, category, mastery_type, mastery_level, ingredients FROM crafting_recipes ORDER BY category, name'),
    q('SELECT name, utensil, ingredients, buff, buff_duration_min, health, energy FROM cooking_recipes ORDER BY name'),
    q('SELECT altar_name, bundle_name, item_name, amount, quality FROM goddess_offerings ORDER BY altar_name, bundle_name, item_name'),
    q('SELECT name, sell_price, description FROM animal_products ORDER BY name'),
    q('SELECT name, sell_price, description FROM artisan_products ORDER BY name'),
    q('SELECT name, tool_type, tier, price, days_delay, requirements FROM tools ORDER BY tool_type, tier'),
  ]);

  const cropLines = crops.rows.map(c =>
    `- ${c.name} (${c.type}, ${c.season}, rank ${c.town_rank}): ` +
    `${c.grow_days != null ? c.grow_days + 'd grow' : 'no grow time'}, ` +
    `seed cost ${c.seed_price}g, sells ${c.sell_price}g (Base) / ${c.price_bronze}g (Bronze) / ${c.price_silver}g (Silver) / ${c.price_gold}g (Gold) / ${c.price_osmium}g (Osmium)` +
    `${c.regrowth_days != null ? `, regrows every ${c.regrowth_days}d` : ''}` +
    `${c.notes ? `. ${c.notes}` : ''}`);

  const caveLines = caves.rows.map(c =>
    `- ${c.item_name} (${c.item_type}) — ${c.cave} mine, floors ${c.floor_range}` +
    `${c.notes ? `. ${c.notes}` : ''}`);

  const forageLines = forageables.rows.map(f =>
    `- ${f.name} (${f.season}) — ${f.location} [${f.area}]` +
    `${f.sell_price != null ? `, sells ${f.sell_price}g` : ''}${f.notes ? `. ${f.notes}` : ''}`);

  const collectibleLines = collectibles.rows.map(c => {
    let line = `- ${c.name} (${c.category}`;
    if (c.rarity) line += `, ${c.rarity}`;
    line += `)`;
    if (c.seasons) line += `, ${c.seasons}`;
    if (c.locations) line += ` @ ${c.locations}`;
    if (c.time_of_day && c.time_of_day !== 'Any time') line += `, ${c.time_of_day}`;
    if (c.sell_price != null) line += `: sells ${c.sell_price}g`;
    return line;
  });

  // ingredients is JSONB (arrives parsed) on freshly-seeded DBs, but a JSON
  // string on DBs seeded before the type change — handle both.
  const parseIngredients = (v) => {
    if (Array.isArray(v)) return v;
    try { return JSON.parse(v) || []; } catch { return []; }
  };

  const craftingLines = crafting.rows.map(r => {
    const ingredients = parseIngredients(r.ingredients);
    const ingStr = ingredients.map(i => `${i.amount}x ${i.name}`).join(', ') || 'unknown';
    let line = `- ${r.name}${r.output_amount > 1 ? ` (makes ${r.output_amount})` : ''} [${r.category}]`;
    if (r.mastery_type) line += ` — unlocks at ${r.mastery_type} mastery lvl ${r.mastery_level}`;
    line += `. Ingredients: ${ingStr}`;
    return line;
  });

  const cookingLines = cooking.rows.map(r => {
    const ingredients = parseIngredients(r.ingredients);
    const ingStr = ingredients.map(i => `${i.amount}x ${i.name}`).join(', ') || 'unknown';
    let line = `- ${r.name} [cooked in ${r.utensil}]`;
    if (r.buff) line += ` — buff: ${r.buff}${r.buff_duration_min ? ` (~${r.buff_duration_min}m)` : ''}`;
    const restore = [];
    if (r.health) restore.push(`HP +${r.health}`);
    if (r.energy) restore.push(`Energy +${r.energy}`);
    if (restore.length) line += `; restores ${restore.join(', ')}`;
    line += `. Ingredients: ${ingStr}`;
    return line;
  });

  const npcLines = npcs.rows.map(n => {
    let line = `- ${n.name} (${n.role})`;
    if (n.birthday) line += `, birthday ${n.birthday}`;
    if (n.location) line += ` @ ${n.location}`;
    if (n.schedule) line += `. Schedule: ${n.schedule}`;
    if (n.loved_gifts) line += `. Loved gifts: ${n.loved_gifts}`;
    if (n.liked_gifts) line += `. Liked gifts: ${n.liked_gifts}`;
    if (n.quest_summary) line += `. About: ${n.quest_summary}`;
    return line;
  });

  const offeringLines = offerings.rows.map(o => 
    `- [${o.altar_name}] ${o.bundle_name}: requires ${o.amount}x ${o.quality} ${o.item_name}`
  );

  const animalLines = animals.rows.map(a => 
    `- ${a.name}: ${a.description || 'Animal product'}${a.sell_price ? `, sells for ${a.sell_price}g` : ''}`
  );

  const artisanLines = artisan.rows.map(a => 
    `- ${a.name}: ${a.description || 'Artisan product'}${a.sell_price ? `, sells for ${a.sell_price}g` : ''}`
  );

  const toolLines = tools.rows.map(t => {
    let reqs = [];
    try { reqs = JSON.parse(t.requirements); } catch(e) {}
    const reqStr = reqs.map(r => `${r.amount}x ${r.name}`).join(', ');
    return `- ${t.name} (${t.tool_type}, ${t.tier}): Costs ${t.price}g and takes ${t.days_delay} days. Requires: ${reqStr}`;
  });

  // If every section is empty the DB is unreachable or completely unseeded —
  // surface that instead of asking the model to answer with no context.
  const sections = [
    ['# CROPS', cropLines],
    ['# CAVE ITEMS', caveLines],
    ['# FORAGEABLES', forageLines],
    ['# COLLECTIBLES (fish, insects, sea critters, fossils, artifacts, gems)', collectibleLines],
    ['# CRAFTING RECIPES', craftingLines],
    ['# COOKING RECIPES (food buffs: skill/stat bonuses, HP & energy restore)', cookingLines],
    ['# NPCS', npcLines],
    ['# GODDESS OFFERINGS (bundles)', offeringLines],
    ['# ANIMAL PRODUCTS', animalLines],
    ['# ARTISAN PRODUCTS', artisanLines],
    ['# TOOLS AND EQUIPMENT UPGRADES', toolLines],
  ];
  if (sections.every(([, lines]) => lines.length === 0)) {
    throw new Error('database context is empty — DB is unreachable or unseeded');
  }

  return sections.map(([heading, lines]) => `${heading}\n${lines.join('\n')}`).join('\n\n');
}

// Hard cap on question length — everything past this is either an accident or
// an attempt to burn API credits; real questions fit comfortably under it.
const MAX_QUERY_CHARS = 500;

// GET /api/search/history
// Returns the user's past searches and AI responses.
router.get('/history', async (req, res) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
  if (!token) return res.status(401).json({ error: 'Unauthorised' });

  let user;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return res.status(401).json({ error: 'Invalid token' });
    user = data.user;
  } catch (err) {
    return res.status(500).json({ error: 'Auth service unavailable' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, query, response, created_at FROM search_logs WHERE user_id = $1 AND response IS NOT NULL ORDER BY created_at DESC LIMIT 50',
      [user.id]
    );
    res.json(rows.reverse());
  } catch (err) {
    console.error('GET /api/search/history failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch search history' });
  }
});

// POST /api/search  { query, gameState }
// Streams the AI answer back as plain text. Requires a valid auth token.
router.post('/', searchRateLimiter, async (req, res) => {
  const query = req.body && req.body.query;
  const gameState = req.body && req.body.gameState;
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Missing "query" in request body' });
  }
  if (query.trim().length > MAX_QUERY_CHARS) {
    return res.status(400).json({ error: `Question is too long — keep it under ${MAX_QUERY_CHARS} characters.` });
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
  }

  // Require auth — AI features are locked behind registered accounts.
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
  if (!token) {
    return res.status(401).json({ error: 'Sign in to use AI search' });
  }
  let user;
  try {
    const { data, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    user = data.user;
  } catch (err) {
    console.error('POST /api/search auth check failed:', err.message);
    return res.status(500).json({ error: 'Auth service unavailable' });
  }
  const userId = user.id;

  // Abort the Anthropic stream if the caller disconnects mid-answer so we stop
  // paying for tokens nobody will read. ServerResponse 'close' also fires after
  // a normal finish, hence the writableFinished guard.
  const abort = new AbortController();
  res.on('close', () => {
    if (!res.writableFinished) abort.abort();
  });

  try {
    // ── Testing limits ────────────────────────────────────────────────────────
    // A master toggle + two caps guard against unexpectedly burning Anthropic
    // credits: a GLOBAL daily cap (total across everyone) and a per-user daily
    // cap (explicit limit, else the configured default). All editable from the
    // admin dashboard; the whole block is skipped when limits are toggled off.
    const limits = await getSearchLimits();
    if (limits.enabled) {
      // Global cap — total AI searches today across all users
      if (limits.globalLimit !== null) {
        const { rows } = await pool.query(
          "SELECT COUNT(*) FROM search_logs WHERE created_at >= CURRENT_DATE"
        );
        if (parseInt(rows[0].count, 10) >= limits.globalLimit) {
          return res.status(429).json({
            error: `The AI guide's daily testing budget (${limits.globalLimit} searches) is used up for today. Try again tomorrow.`,
          });
        }
      }

      // Per-user cap — the user's explicit limit, else the configured default
      const { rows: limitRows } = await pool.query(
        'SELECT daily_search_limit FROM user_roles WHERE user_id = $1',
        [userId]
      );
      const explicit = limitRows.length > 0 ? limitRows[0].daily_search_limit : null;
      const effectiveLimit = explicit != null ? explicit : limits.defaultUserLimit;
      if (effectiveLimit !== null) {
        const { rows: countRows } = await pool.query(
          "SELECT COUNT(*) FROM search_logs WHERE user_id = $1 AND created_at >= CURRENT_DATE",
          [userId]
        );
        const usedToday = parseInt(countRows[0].count, 10);
        if (usedToday >= effectiveLimit) {
          return res.status(429).json({
            error: `Daily limit reached — you've used all ${effectiveLimit} AI searches for today. Try again tomorrow.`,
          });
        }
      }
    }

    const context = await buildContext();
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');

    let dynamicPrompt = SYSTEM_PROMPT;
    if (gameState) {
      dynamicPrompt += `\n\nCRITICAL CONTEXT: The user's current in-game state is Season: ${gameState.season}, Time: ${gameState.time}, Weather: ${gameState.weather}. You MUST heavily weigh this state in your answer. Only recommend activities, fish, bugs, or shops that are available in this exact season, time, and weather condition.`;
    }

    const stream = await ai.models.generateContentStream({
      model: MODEL,
      contents: `Game database context:\n\n${context}\n\nQuestion: ${query.trim()}`,
      config: {
        systemInstruction: dynamicPrompt,
        tools: [
          {
            functionDeclarations: [
              {
                name: "mark_offering_complete",
                description: "Mark a Lake Temple Goddess Offering item as completed/donated. Use this when the user says they caught, donated, or completed an item that belongs to an offering.",
                parameters: {
                  type: "OBJECT",
                  properties: { itemName: { type: "STRING", description: "The precise name of the item, e.g. Wasabi" } },
                  required: ["itemName"]
                }
              },
              {
                name: "add_custom_task",
                description: "Add a task to the user's custom daily checklist. Use this when the user asks to be reminded to do something.",
                parameters: {
                  type: "OBJECT",
                  properties: { taskName: { type: "STRING", description: "The task to add, e.g. Buy potato seeds" } },
                  required: ["taskName"]
                }
              }
            ]
          }
        ]
      }
    });

    // Log the search and get its ID to update later with the response.
    // We do this BEFORE the stream to ensure it counts against the daily quota immediately.
    let logId = null;
    try {
      const { rows } = await pool.query(
        'INSERT INTO search_logs (user_id, user_email, query, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id',
        [userId, user.email || null, query.trim()]
      );
      logId = rows[0].id;
    } catch (e) {
      if (e.code === '42703') { // Fallback if migration 004 is missing
        try {
          const { rows } = await pool.query(
            'INSERT INTO search_logs (user_id, query, created_at) VALUES ($1, $2, NOW()) RETURNING id',
            [userId, query.trim()]
          );
          logId = rows[0].id;
        } catch (e2) {
          console.error('search log insert fallback failed:', e2.message);
        }
      } else {
        console.error('search log insert failed:', e.message);
      }
    }

    let fullResponse = '';
    for await (const chunk of stream) {
      if (abort.signal.aborted) break;

      // Intercept and execute function calls mid-stream
      if (chunk.functionCalls && chunk.functionCalls.length > 0) {
        for (const call of chunk.functionCalls) {
          if (call.name === 'mark_offering_complete') {
            const itemName = call.args.itemName;
            await pool.query(
              'INSERT INTO user_offerings (user_id, item_name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [userId, itemName]
            );
            const msg = `\n\n✅ **Action Taken:** Marked *${itemName}* as donated to the Lake Temple!`;
            fullResponse += msg;
            res.write(msg);
          } else if (call.name === 'add_custom_task') {
            const taskName = call.args.taskName;
            const { rows } = await pool.query('SELECT tasks FROM user_checklists WHERE user_id = $1', [userId]);
            let tasks = rows.length > 0 ? rows[0].tasks : [];
            if (typeof tasks === 'string') {
              try { tasks = JSON.parse(tasks); } catch(e) { tasks = []; }
            }
            if (!Array.isArray(tasks)) {
              tasks = [];
            }
            tasks.push({ id: Date.now().toString(), text: taskName, completed: false });
            await pool.query(
              'INSERT INTO user_checklists (user_id, tasks) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET tasks = EXCLUDED.tasks',
              [userId, JSON.stringify(tasks)]
            );
            const msg = `\n\n✅ **Action Taken:** Added *"${taskName}"* to your tasks!`;
            fullResponse += msg;
            res.write(msg);
          }
        }
      }

      // Forward text content to the client (ignoring missing-text warnings from SDK)
      try {
        if (chunk.text) {
          fullResponse += chunk.text;
          res.write(chunk.text);
        }
      } catch (e) {
        // SDK throws or warns if you read .text when only a functionCall is present
      }
    }
    res.end();

    // Save the AI response asynchronously
    if (logId && fullResponse) {
      pool.query('UPDATE search_logs SET response = $1 WHERE id = $2', [fullResponse, logId])
        .catch(e => console.error('search log update failed:', e.message));
    }
  } catch (err) {
    // Caller hung up and we cancelled the stream — not a failure, just stop.
    if (abort.signal.aborted) {
      console.log('POST /api/search: client disconnected, stream aborted');
      return res.end();
    }
    console.error('POST /api/search failed:', err.message);
    const status = err && err.status;
    const isBilling = status === 400 && /credit balance|billing|quota/i.test(err.message || '');
    if (isBilling) {
      console.error('  ^ Gemini API credit balance exhausted or quota reached.');
    }
    if (!res.headersSent) {
      if (status === 429) {
        res.status(503).json({ error: 'The AI guide is busy right now — please try again in a moment.' });
      } else if (isBilling || status === 401 || status === 403) {
        res.status(503).json({ error: 'The AI guide is temporarily unavailable. Please try again later.' });
      } else {
        console.error("AI SEARCH ERROR:", err);
        res.status(500).json({ error: 'AI search failed. ' + (err.message || 'Unknown error') });
      }
    } else {
      res.end();
    }
  }
});

module.exports = router;
