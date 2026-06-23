const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/requireAuth');
const { getSearchLimits } = require('../lib/settings');
const rateLimit = require('express-rate-limit');
const { MAX_IMAGE_CHARS, MAX_QUERY_CHARS, MODEL } = require('../ai/config');
const { cacheKeyFor, getCachedAnswer, setCachedAnswer } = require('../ai/cache');
const { tryDirectAnswer } = require('../ai/directAnswers');
const { buildRelevantContext, getDonatedString } = require('../ai/retrieval');
const { streamGeminiAnswer } = require('../ai/gemini');
const {
  countAiSearchesToday,
  getHistoryStats,
  logRequestMetric,
  logSearch,
} = require('../ai/metrics');

const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per `window` (here, per 1 minute)
  message: { error: 'Too many requests. Please wait a minute before asking another question.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});


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
  'TOWN RANKS:\n' +
  'Valid Town Ranks in Coral Island are F, E, D, C, B, A, and S. If the user provides an invalid rank (like a number), politely correct them and assume they meant Rank F unless context suggests otherwise.\n' +
  'FARM LAYOUTS:\n' +
  'When the user asks for a farm layout, crop grid, or spatial design (e.g., "Build me an 11x11 grid"), you MUST output the layout ' +
  'in a special markdown code block exactly like this:\n' +
  '```json\n' +
  '{\n' +
  '  "type": "farm_layout",\n' +
  '  "width": 11,\n' +
  '  "height": 11,\n' +
  '  "grid": [\n' +
  '    ["crop_generic", "crop_generic", "crop_generic"],\n' +
  '    ["crop_generic", "sprinkler_2", "crop_generic"],\n' +
  '    ["crop_generic", "crop_generic", "crop_generic"]\n' +
  '  ]\n' +
  '}\n' +
  '```\n' +
  'Use valid item IDs for equipment/paths: "dirt", "sprinkler_1", "sprinkler_2", "sprinkler_3", "scarecrow_1", "scarecrow_2", "path_stone".\n' +
  'For crops, you can use ANY crop name formatted as `crop_name` (e.g. "crop_blueberry", "crop_radish", "crop_melon").\n' +
  'NEVER draw ASCII or text-based grids (like C C P C). Only use the JSON block. You can add normal text to explain your layout before or after the JSON block.\n' +
  'GIFT COACH:\n' +
  'If the user asks who to gift or talk to (e.g., "I have 500g and it is Night, who should I gift?"), act as a Gift Coach. Cross-reference the [CURRENT GAME STATE] time/season with NPC schedules in the database to determine who is currently available, and suggest their easiest loved/liked gifts.\n' +
  'DAILY PLANNER / GAME SYNCING:\n' +
  'If the user asks "What should I do today?" or similar, act as a Daily Planner. Look at the [CURRENT GAME STATE]. Suggest 3-5 highly specific activities for that exact day/season (e.g., crops that need planting before season ends, birthdays today, limited-time bugs/fish to catch, or bundles to finish).\n' +
  'PROFIT CALCULATORS:\n' +
  'If the user asks to calculate crop profits, ROI, or math for a specific crop/setup, you MUST output the math in a special markdown code block exactly like this:\n' +
  '```json\n' +
  '{\n' +
  '  "type": "profit_calculator",\n' +
  '  "crop": "Radish",\n' +
  '  "seedCost": 60,\n' +
  '  "sellPriceBase": 90,\n' +
  '  "growDays": 6,\n' +
  '  "amount": 10,\n' +
  '  "totalCost": 600,\n' +
  '  "totalRevenue": 900,\n' +
  '  "netProfit": 300\n' +
  '}\n' +
  '```\n' +
  'You can add normal text before or after this JSON block to explain your math. If the user asks to factor in fertilizer, assume Fertilizer I costs 20g, Fertilizer II costs 40g, and Fertilizer III costs 60g, and add this to the seedCost/totalCost calculation.\n' +
  'BUNDLE WIZARD:\n' +
  'If the user asks for their progress on an Altar or Bundle (e.g., "What do I need for the Rare Altar?"), you MUST output a JSON block like this:\n' +
  '```json\n' +
  '{\n' +
  '  "type": "bundle_wizard",\n' +
  '  "altar": "Advanced Altar",\n' +
  '  "bundle": "Rare Crop",\n' +
  '  "items": [\n' +
  '    {"name": "Osmium Cotton", "season": "Winter", "location": "Farm", "completed": false}\n' +
  '  ]\n' +
  '}\n' +
  '```\n' +
  'Cross-reference the items in the bundle with the [COMPLETED OFFERINGS] list to set "completed": true or false.\n' +
  'COLLECTIONS VISUALIZER:\n' +
  'If the user asks what bugs, fish, or ocean critters they are missing for the museum (e.g., "What bugs am I missing in Summer?"), you MUST output a JSON block like this:\n' +
  '```json\n' +
  '{\n' +
  '  "type": "collections_visualizer",\n' +
  '  "category": "Bug",\n' +
  '  "season": "Summer",\n' +
  '  "items": [\n' +
  '    {"name": "Atlas Moth", "completed": false}\n' +
  '  ]\n' +
  '}\n' +
  '```\n' +
  'Filter the items by the user\'s criteria. Cross-reference with [COMPLETED OFFERINGS] to set "completed": true or false. Include ONLY items that are relevant (e.g. only bugs found in Summer).';

// GET /api/search/index
// Returns a cached global search array for the Command Palette.
let cachedGlobalIndex = null;
let cachedGlobalIndexTime = 0;
let cachedGlobalIndexEtag = null;

router.get('/index', async (req, res) => {
  try {
    const CACHE_TTL = 60 * 60 * 1000;
    if (cachedGlobalIndex && (Date.now() - cachedGlobalIndexTime < CACHE_TTL)) {
      if (cachedGlobalIndexEtag) {
        res.setHeader('ETag', cachedGlobalIndexEtag);
        res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
        if (req.headers['if-none-match'] === cachedGlobalIndexEtag) return res.status(304).end();
      }
      return res.json(cachedGlobalIndex);
    }
    
    const [crops, caves, forageables, npcs, collectibles, cooking, crafting] = await Promise.all([
      pool.query('SELECT id, name, type, season FROM crops'),
      pool.query('SELECT id, item_name as name, item_type as type, cave FROM cave_items'),
      pool.query('SELECT id, name, season, location FROM forageables'),
      pool.query('SELECT id, name, role FROM npcs'),
      pool.query('SELECT id, name, category FROM collectibles'),
      pool.query('SELECT id, name, utensil FROM cooking_recipes'),
      pool.query('SELECT id, name, category FROM crafting_recipes')
    ]);

    const index = [];
    const aiGuideResult = (id, type, name, subtitle, prompt) => ({
      id,
      type,
      name,
      subtitle,
      page: 'home',
      route: '/app',
      query: prompt || `Tell me about ${name}.`,
    });

    crops.rows.forEach(c => index.push(aiGuideResult(`crop-${c.id}`, 'Crop', c.name, `${c.season} • ${c.type}`, `Tell me about ${c.name}. Include season, town rank, grow time, and profit.`)));
    caves.rows.forEach(c => index.push(aiGuideResult(`cave-${c.id}`, 'Cave Item', c.name, `${c.type} • ${c.cave} mine`, `Where do I find ${c.name} in the mines?`)));
    forageables.rows.forEach(c => index.push(aiGuideResult(`forage-${c.id}`, 'Forageable', c.name, `${c.season} • ${c.location}`, `Where and when can I forage ${c.name}?`)));
    npcs.rows.forEach(c => index.push(aiGuideResult(`npc-${c.id}`, 'NPC', c.name, c.role || 'Villager', `Tell me about ${c.name}, including gifts and schedule.`)));
    collectibles.rows.forEach(c => index.push(aiGuideResult(`coll-${c.id}`, 'Collectible', c.name, c.category, `Where do I find ${c.name}? Include season, location, and time.`)));
    cooking.rows.forEach(c => index.push(aiGuideResult(`cook-${c.id}`, 'Cooking', c.name, `Utensil: ${c.utensil}`, `How do I cook ${c.name}? Include ingredients, utensil, and buffs.`)));
    crafting.rows.forEach(c => index.push(aiGuideResult(`craft-${c.id}`, 'Crafting', c.name, `Category: ${c.category}`, `How do I craft ${c.name}? Show the full recipe.`)));

    const sortedIndex = index.sort((a, b) => a.name.localeCompare(b.name));
    cachedGlobalIndex = sortedIndex;
    cachedGlobalIndexTime = Date.now();
    cachedGlobalIndexEtag = `"search-index-${sortedIndex.length}-${cachedGlobalIndexTime}"`;
    res.setHeader('ETag', cachedGlobalIndexEtag);
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    res.json(sortedIndex);
  } catch (err) {
    console.error('GET /api/search/index failed:', err.message);
    res.status(500).json({ error: 'Failed to build index' });
  }
});

// GET /api/search/history
// Returns the user's past searches and AI responses.
router.get('/history', requireAuth, async (req, res) => {
  const user = req.user;

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
router.post('/', searchRateLimiter, requireAuth, async (req, res) => {
  const startedAt = Date.now();
  const { query, image, gameState, activeTab } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }
  const trimmedQuery = query.trim();
  const historyStats = getHistoryStats(req.body.history);
  if (trimmedQuery.length > MAX_QUERY_CHARS) {
    return res.status(400).json({ error: `Query is too long. Please keep it under ${MAX_QUERY_CHARS} characters.` });
  }
  if (image && String(image).length > MAX_IMAGE_CHARS) {
    return res.status(400).json({ error: 'Attached image is too large. Please upload a smaller screenshot.' });
  }

  const user = req.user;
  const userId = user.id;

  const directAnswer = await tryDirectAnswer(trimmedQuery);
  if (directAnswer) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    const logId = await logSearch(user, trimmedQuery, directAnswer, 'direct');
    await logRequestMetric({
      searchLogId: logId,
      userId,
      source: 'direct',
      status: 'completed',
      queryChars: trimmedQuery.length,
      ...historyStats,
      responseChars: directAnswer.length,
      durationMs: Date.now() - startedAt,
    });
    return res.send(directAnswer);
  }

  const donatedString = await getDonatedString(userId);
  const cacheKey = !image ? cacheKeyFor(trimmedQuery, gameState, donatedString) : null;
  const cachedAnswer = cacheKey ? getCachedAnswer(cacheKey) : null;
  if (cachedAnswer) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    const logId = await logSearch(user, trimmedQuery, cachedAnswer, 'cache');
    await logRequestMetric({
      searchLogId: logId,
      userId,
      source: 'cache',
      status: 'completed',
      queryChars: trimmedQuery.length,
      ...historyStats,
      responseChars: cachedAnswer.length,
      durationMs: Date.now() - startedAt,
      cacheHit: true,
    });
    return res.send(cachedAnswer);
  }

  if (!process.env.GEMINI_API_KEY) {
    await logRequestMetric({
      userId,
      source: 'ai',
      model: MODEL,
      status: 'error',
      queryChars: trimmedQuery.length,
      ...historyStats,
      durationMs: Date.now() - startedAt,
      error: 'GEMINI_API_KEY is not configured',
    });
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
  }

  // Abort the Gemini stream if the caller disconnects mid-answer so we stop
  // paying for tokens nobody will read. ServerResponse 'close' also fires after
  // a normal finish, hence the writableFinished guard.
  const abort = new AbortController();
  res.on('close', () => {
    if (!res.writableFinished) abort.abort();
  });

  try {
    // ── Testing limits ────────────────────────────────────────────────────────
    // A master toggle + two caps guard against unexpectedly burning Gemini
    // credits: a GLOBAL daily cap (total across everyone) and a per-user daily
    // cap (explicit limit, else the configured default). All editable from the
    // admin dashboard; the whole block is skipped when limits are toggled off.
    const limits = await getSearchLimits();
    if (limits.enabled) {
      // Global cap — total AI searches today across all users
      if (limits.globalLimit !== null) {
        const usedToday = await countAiSearchesToday();
        if (usedToday >= limits.globalLimit) {
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
        const usedToday = await countAiSearchesToday(userId);
        if (usedToday >= effectiveLimit) {
          return res.status(429).json({
            error: `Daily limit reached — you've used all ${effectiveLimit} AI searches for today. Try again tomorrow.`,
          });
        }
      }
    }

    const contextResult = await buildRelevantContext(trimmedQuery, { activeTab, hasImage: Boolean(image) });
    const context = contextResult.text;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');

    const logId = await logSearch(user, trimmedQuery, null, 'ai');
    const { fullResponse, usedToolCall } = await streamGeminiAnswer({
      systemPrompt: SYSTEM_PROMPT,
      query: trimmedQuery,
      image,
      gameState,
      donatedString,
      context,
      history: req.body.history,
      userId,
      res,
      abort,
    });
    res.end();

    if (logId && fullResponse) {
      pool.query('UPDATE search_logs SET response = $1 WHERE id = $2', [fullResponse, logId])
        .catch(e => console.error('search log update failed:', e.message));
    }
    if (cacheKey && fullResponse && !usedToolCall) {
      setCachedAnswer(cacheKey, fullResponse);
    }
    await logRequestMetric({
      searchLogId: logId,
      userId,
      source: 'ai',
      model: MODEL,
      status: abort.signal.aborted ? 'aborted' : 'completed',
      queryChars: trimmedQuery.length,
      ...historyStats,
      contextChars: context.length,
      retrievedDocs: contextResult.retrievedDocs,
      responseChars: fullResponse.length,
      durationMs: Date.now() - startedAt,
      usedToolCall,
      aborted: abort.signal.aborted,
    });
  } catch (err) {
    // Caller hung up and we cancelled the stream — not a failure, just stop.
    if (abort.signal.aborted) {
      console.log('POST /api/search: client disconnected, stream aborted');
      await logRequestMetric({
        userId,
        source: 'ai',
        model: MODEL,
        status: 'aborted',
        queryChars: trimmedQuery.length,
        ...historyStats,
        durationMs: Date.now() - startedAt,
        aborted: true,
      });
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
    await logRequestMetric({
      userId,
      source: 'ai',
      model: MODEL,
      status: 'error',
      queryChars: trimmedQuery.length,
      ...historyStats,
      durationMs: Date.now() - startedAt,
      error: err.message || 'Unknown error',
    });
  }
});

module.exports = router;
