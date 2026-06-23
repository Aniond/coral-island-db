const express = require('express');
const router = express.Router();
const pool = require('../db');
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/requireAuth');
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

// Pull the database once, then build a query-focused context for each request.
// Sending the whole DB on every prompt was accurate but wasteful: local seed data
// is ~70k tokens before user history. This keeps the cache, but only sends the
// sections and rows that are likely to matter for the current question.
let cachedAISections = null;
let cachedAISectionsTime = 0;

const AI_CONTEXT_TTL_MS = 60 * 60 * 1000;
const MAX_CONTEXT_CHARS = 85000;
const MAX_HISTORY_MESSAGES = 6;
const MAX_HISTORY_CHARS = 1800;
const MAX_IMAGE_CHARS = 4 * 1024 * 1024;
const RETRIEVAL_LIMIT = 48;
const DIRECT_ANSWER_MIN_SCORE = 3;
const AI_CACHE_TTL_MS = 15 * 60 * 1000;
const AI_CACHE_MAX_ENTRIES = 100;
const STOPWORDS = new Set([
  'about', 'after', 'again', 'also', 'and', 'any', 'are', 'ask', 'best', 'can',
  'coral', 'day', 'does', 'for', 'from', 'get', 'give', 'guide', 'have', 'how',
  'include', 'into', 'island', 'item', 'items', 'make', 'me', 'need', 'please',
  'show', 'tell', 'that', 'the', 'their', 'them', 'this', 'what', 'when',
  'where', 'which', 'with', 'you', 'your',
]);
const DIRECT_INTENT_WORDS = new Set([
  'best', 'boost', 'buff', 'catch', 'cook', 'craft', 'find', 'gift', 'gifts',
  'ingredient', 'ingredients', 'liked', 'location', 'love', 'loved', 'profit',
  'recipe', 'sell', 'where',
]);

const aiResponseCache = new Map();

function normalizeText(value) {
  return String(value || '').toLowerCase();
}

function extractTerms(query) {
  return normalizeText(query)
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map(t => t.replace(/^-+|-+$/g, ''))
    .filter(t => t.length >= 3 && !STOPWORDS.has(t))
    .map(t => (t.length > 4 && t.endsWith('s') ? t.slice(0, -1) : t));
}

function hasAny(text, words) {
  return words.some(word => text.includes(word));
}

function getDirectTerms(query) {
  return extractTerms(query).filter(term => !DIRECT_INTENT_WORDS.has(term));
}

function scoreText(text, terms) {
  const normalized = normalizeText(text);
  return terms.reduce((score, term) => score + (normalized.includes(term) ? (term.length > 5 ? 3 : 2) : 0), 0);
}

function scoreRow(row, terms, fields) {
  const nameScore = scoreText(row.name || row.item_name || '', terms) * 3;
  const bodyScore = scoreText(fields.map(field => row[field]).join(' '), terms);
  return nameScore + bodyScore;
}

function pickBestRow(rows, query, fields) {
  const terms = getDirectTerms(query);
  if (terms.length === 0) return null;
  const best = rows
    .map(row => ({ row, score: scoreRow(row, terms, fields) }))
    .sort((a, b) => b.score - a.score)[0];
  return best && best.score >= DIRECT_ANSWER_MIN_SCORE ? best.row : null;
}

function parseMaybeJson(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function formatIngredients(value) {
  const ingredients = parseMaybeJson(value);
  return ingredients.length
    ? ingredients.map(item => `${item.amount || 1}x ${item.name}`).join(', ')
    : 'unknown';
}

function cacheKeyFor(query, gameState, donatedString) {
  const state = gameState
    ? `${gameState.season || ''}|${gameState.day || ''}|${gameState.time || ''}|${gameState.weather || ''}|${gameState.rank || ''}`
    : '';
  return `${normalizeText(query).replace(/\s+/g, ' ').trim()}::${state}::${donatedString || ''}`;
}

function getCachedAnswer(key) {
  const entry = aiResponseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.time > AI_CACHE_TTL_MS) {
    aiResponseCache.delete(key);
    return null;
  }
  aiResponseCache.delete(key);
  aiResponseCache.set(key, entry);
  return entry.response;
}

function setCachedAnswer(key, response) {
  if (!response) return;
  aiResponseCache.set(key, { response, time: Date.now() });
  while (aiResponseCache.size > AI_CACHE_MAX_ENTRIES) {
    const oldestKey = aiResponseCache.keys().next().value;
    aiResponseCache.delete(oldestKey);
  }
}

async function logSearch(user, query, response, source = 'ai') {
  const userId = user?.id || null;
  try {
    const { rows } = await pool.query(
      'INSERT INTO search_logs (user_id, user_email, query, response, source, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id',
      [userId, user?.email || null, query, response || null, source]
    );
    return rows[0].id;
  } catch (e) {
    if (e.code === '42703') {
      try {
        const { rows } = await pool.query(
          'INSERT INTO search_logs (user_id, user_email, query, response, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id',
          [userId, user?.email || null, query, response || null]
        );
        return rows[0].id;
      } catch (e2) {
        if (e2.code === '42703') {
          try {
            const { rows } = await pool.query(
              'INSERT INTO search_logs (user_id, query, created_at) VALUES ($1, $2, NOW()) RETURNING id',
              [userId, query]
            );
            if (response) {
              pool.query('UPDATE search_logs SET response = $1 WHERE id = $2', [response, rows[0].id])
                .catch(err => console.error(`${source} search log response update failed:`, err.message));
            }
            return rows[0].id;
          } catch (e3) {
            console.error(`${source} search log insert legacy fallback failed:`, e3.message);
            return null;
          }
        }
        console.error(`${source} search log insert fallback failed:`, e2.message);
        return null;
      }
    }
    console.error(`${source} search log insert failed:`, e.message);
    return null;
  }
}

async function logRequestMetric({
  searchLogId = null,
  userId = null,
  source,
  model = null,
  status,
  queryChars = 0,
  historyMessages = 0,
  historyChars = 0,
  contextChars = 0,
  retrievedDocs = 0,
  responseChars = 0,
  durationMs = 0,
  cacheHit = false,
  usedToolCall = false,
  aborted = false,
  error = null,
}) {
  try {
    await pool.query(
      `INSERT INTO ai_request_metrics (
        search_log_id, user_id, source, model, status, query_chars,
        history_messages, history_chars, context_chars, retrieved_docs,
        response_chars, duration_ms, cache_hit, used_tool_call, aborted, error
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        searchLogId, userId, source, model, status, queryChars,
        historyMessages, historyChars, contextChars, retrievedDocs,
        responseChars, durationMs, cacheHit, usedToolCall, aborted,
        error ? String(error).slice(0, 500) : null,
      ]
    );
  } catch (e) {
    if (e.code !== '42P01') console.error('ai_request_metrics insert failed:', e.message);
  }
}

function getHistoryStats(history) {
  const items = Array.isArray(history) ? history.slice(-MAX_HISTORY_MESSAGES) : [];
  return {
    historyMessages: items.length,
    historyChars: items.reduce((sum, item) => sum + String(item.content || '').slice(0, MAX_HISTORY_CHARS).length, 0),
  };
}

async function countAiSearchesToday(userId = null) {
  const withSource = userId
    ? ["SELECT COUNT(*) FROM search_logs WHERE source = 'ai' AND user_id = $1 AND created_at >= CURRENT_DATE", [userId]]
    : ["SELECT COUNT(*) FROM search_logs WHERE source = 'ai' AND created_at >= CURRENT_DATE", []];
  const legacy = userId
    ? ['SELECT COUNT(*) FROM search_logs WHERE user_id = $1 AND created_at >= CURRENT_DATE', [userId]]
    : ['SELECT COUNT(*) FROM search_logs WHERE created_at >= CURRENT_DATE', []];
  try {
    const { rows } = await pool.query(withSource[0], withSource[1]);
    return parseInt(rows[0].count, 10);
  } catch (e) {
    if (e.code !== '42703') throw e;
    const { rows } = await pool.query(legacy[0], legacy[1]);
    return parseInt(rows[0].count, 10);
  }
}

async function retrieveContextDocs(query) {
  const terms = extractTerms(query);
  if (terms.length === 0) return [];
  const search = terms.join(' ');
  const patterns = terms.map(term => `%${term}%`);
  const sql = `
    WITH docs AS (
      SELECT 'Crop' AS source_type, id::text AS source_id, name,
        concat_ws(' ', name, type, season, town_rank, grow_days, seed_price, sell_price, regrowth_days, notes) AS search_text,
        concat('- ', name, ' (Crop): ', season, ', rank ', town_rank, ', ', grow_days, 'd grow, seed ', seed_price, 'g, sells ', sell_price, 'g', coalesce(', notes: ' || notes, '')) AS context_text
      FROM crops
      UNION ALL
      SELECT 'Cave Item', id::text, item_name,
        concat_ws(' ', item_name, item_type, cave, floor_range, notes),
        concat('- ', item_name, ' (', item_type, '): ', cave, ' mine, floors ', floor_range, coalesce(', notes: ' || notes, ''))
      FROM cave_items
      UNION ALL
      SELECT 'Forageable', id::text, name,
        concat_ws(' ', name, season, location, area, notes, sell_price),
        concat('- ', name, ' (Forageable): ', season, ' @ ', location, ' [', area, ']', coalesce(', sells ' || sell_price || 'g', ''), coalesce(', notes: ' || notes, ''))
      FROM forageables
      UNION ALL
      SELECT 'Collectible', id::text, name,
        concat_ws(' ', category, name, sell_price, rarity, seasons, locations, time_of_day),
        concat('- ', name, ' (', category, '): ', coalesce(seasons, 'any season'), ' @ ', coalesce(locations, 'unknown'), ', ', coalesce(time_of_day, 'any time'), coalesce(', sells ' || sell_price || 'g', ''))
      FROM collectibles
      UNION ALL
      SELECT 'Crafting Recipe', id::text, name,
        concat_ws(' ', name, category, mastery_type, mastery_level, ingredients::text),
        concat('- ', name, ' (Crafting): ', coalesce(category, 'misc'), ', makes ', output_amount, coalesce(', unlock ' || mastery_type || ' lvl ' || mastery_level, ''), '. Ingredients: ', ingredients::text)
      FROM crafting_recipes
      UNION ALL
      SELECT 'Cooking Recipe', id::text, name,
        concat_ws(' ', name, utensil, ingredients::text, buff, buff_duration_min, health, energy),
        concat('- ', name, ' (Cooking): utensil ', coalesce(utensil, 'unknown'), coalesce(', buff ' || buff, ''), coalesce(', HP +' || health, ''), coalesce(', Energy +' || energy, ''), '. Ingredients: ', ingredients::text)
      FROM cooking_recipes
      UNION ALL
      SELECT 'NPC', id::text, name,
        concat_ws(' ', name, role, location, schedule, loved_gifts, liked_gifts, quest_summary, birthday),
        concat('- ', name, ' (NPC): ', coalesce(role, 'Villager'), coalesce(' @ ' || location, ''), coalesce(', birthday ' || birthday, ''), coalesce('. Loved gifts: ' || loved_gifts, ''), coalesce('. Liked gifts: ' || liked_gifts, ''), coalesce('. Schedule: ' || schedule, ''))
      FROM npcs
      UNION ALL
      SELECT 'Goddess Offering', id::text, item_name,
        concat_ws(' ', altar_name, bundle_name, item_name, amount, quality),
        concat('- [', altar_name, '] ', bundle_name, ': requires ', amount, 'x ', quality, ' ', item_name)
      FROM goddess_offerings
      UNION ALL
      SELECT 'Animal Product', id::text, name,
        concat_ws(' ', name, sell_price, description),
        concat('- ', name, ' (Animal Product): ', coalesce(description, 'Animal product'), coalesce(', sells ' || sell_price || 'g', ''))
      FROM animal_products
      UNION ALL
      SELECT 'Artisan Product', id::text, name,
        concat_ws(' ', name, sell_price, description),
        concat('- ', name, ' (Artisan Product): ', coalesce(description, 'Artisan product'), coalesce(', sells ' || sell_price || 'g', ''))
      FROM artisan_products
      UNION ALL
      SELECT 'Tool', id::text, name,
        concat_ws(' ', name, tool_type, tier, price, days_delay, requirements::text),
        concat('- ', name, ' (Tool): ', tool_type, ' ', tier, ', costs ', price, 'g, takes ', days_delay, ' days. Requires: ', requirements::text)
      FROM tools
    ),
    ranked AS (
      SELECT source_type, source_id, name, context_text,
        ts_rank_cd(to_tsvector('simple', search_text), plainto_tsquery('simple', $1)) AS rank
      FROM docs
      WHERE to_tsvector('simple', search_text) @@ plainto_tsquery('simple', $1)
         OR search_text ILIKE ANY($2::text[])
    )
    SELECT source_type, source_id, name, context_text, rank
    FROM ranked
    ORDER BY rank DESC, name
    LIMIT $3
  `;
  try {
    const { rows } = await pool.query(sql, [search, patterns, RETRIEVAL_LIMIT]);
    return rows;
  } catch (e) {
    console.error('retrieveContextDocs failed:', e.message);
    return [];
  }
}

function renderRetrievedContext(docs) {
  if (!docs.length) return '';
  const groups = new Map();
  for (const doc of docs) {
    if (!groups.has(doc.source_type)) groups.set(doc.source_type, []);
    groups.get(doc.source_type).push(doc.context_text);
  }
  return [...groups.entries()]
    .map(([type, lines]) => `# RETRIEVED ${type.toUpperCase()} ROWS\n${lines.join('\n')}`)
    .join('\n\n');
}

function hasQuestionIntent(query, words) {
  return hasAny(normalizeText(query), words);
}

function detectSeason(query) {
  const text = normalizeText(query);
  for (const season of ['spring', 'summer', 'fall', 'winter']) {
    if (text.includes(season)) return season;
  }
  return null;
}

async function directNpcGiftAnswer(query) {
  if (!hasQuestionIntent(query, ['gift', 'gifts', 'love', 'loved', 'liked', 'birthday', 'schedule'])) return null;
  const { rows } = await pool.query('SELECT name, role, location, schedule, loved_gifts, liked_gifts, birthday FROM npcs ORDER BY name');
  const npc = pickBestRow(rows, query, ['name', 'role', 'location', 'loved_gifts', 'liked_gifts', 'birthday']);
  if (!npc) return null;
  return [
    `## ${npc.name}`,
    npc.role ? `${npc.role}${npc.location ? ` at ${npc.location}` : ''}.` : '',
    npc.birthday ? `- **Birthday:** ${npc.birthday}` : '',
    npc.loved_gifts ? `- **Loved gifts:** ${npc.loved_gifts}` : '',
    npc.liked_gifts ? `- **Liked gifts:** ${npc.liked_gifts}` : '',
    npc.schedule ? `- **Schedule:** ${npc.schedule}` : '',
  ].filter(Boolean).join('\n');
}

async function directFoodBuffAnswer(query) {
  const text = normalizeText(query);
  if (!hasQuestionIntent(query, ['food', 'dish', 'cook', 'buff', 'boost', 'energy', 'health'])) return null;
  const skills = ['fishing', 'mining', 'farming', 'foraging', 'diving', 'ranching', 'catching'];
  const skill = skills.find(item => text.includes(item));
  const params = [];
  let where = "buff IS NOT NULL AND buff <> ''";
  if (skill) {
    params.push(`%${skill}%`);
    where += ' AND buff ILIKE $1';
  }
  const { rows } = await pool.query(
    `SELECT name, utensil, ingredients, buff, buff_duration_min, health, energy
     FROM cooking_recipes
     WHERE ${where}
     ORDER BY buff DESC, name
     LIMIT 20`,
    params
  );
  if (!rows.length) return null;
  const title = skill ? `## Foods That Boost ${skill[0].toUpperCase()}${skill.slice(1)}` : '## Food Buffs';
  const table = rows.map(r =>
    `| ${r.name} | ${r.buff || '-'} | ${r.utensil || '-'} | ${formatIngredients(r.ingredients)} | ${r.buff_duration_min || '-'} min | ${r.health || 0} / ${r.energy || 0} |`
  );
  return [
    title,
    '| Dish | Buff | Utensil | Key ingredients | Duration | HP / Energy |',
    '|---|---|---|---|---:|---:|',
    ...table,
  ].join('\n');
}

async function directRecipeAnswer(query) {
  const text = normalizeText(query);
  if (!hasQuestionIntent(query, ['craft', 'crafting', 'recipe', 'cook', 'cooking', 'ingredient', 'ingredients', 'make', 'build'])) return null;
  const [crafting, cooking] = await Promise.all([
    pool.query('SELECT name, output_amount, category, mastery_type, mastery_level, ingredients FROM crafting_recipes ORDER BY name'),
    pool.query('SELECT name, utensil, ingredients, buff, buff_duration_min, health, energy FROM cooking_recipes ORDER BY name'),
  ]);
  const craftingPick = pickBestRow(crafting.rows, query, ['name', 'category', 'ingredients', 'mastery_type']);
  const cookingPick = pickBestRow(cooking.rows, query, ['name', 'utensil', 'ingredients', 'buff']);
  const craftingScore = craftingPick ? scoreRow(craftingPick, getDirectTerms(query), ['name', 'category', 'ingredients', 'mastery_type']) : 0;
  const cookingScore = cookingPick ? scoreRow(cookingPick, getDirectTerms(query), ['name', 'utensil', 'ingredients', 'buff']) : 0;
  const recipe = cookingScore > craftingScore ? cookingPick : craftingPick;
  const isCooking = cookingScore > craftingScore;
  if (!recipe) return null;
  if (isCooking) {
    return [
      `## ${recipe.name}`,
      `- **Type:** Cooking`,
      `- **Utensil:** ${recipe.utensil || '-'}`,
      `- **Ingredients:** ${formatIngredients(recipe.ingredients)}`,
      recipe.buff ? `- **Buff:** ${recipe.buff}${recipe.buff_duration_min ? ` for about ${recipe.buff_duration_min} minutes` : ''}` : '',
      `- **Restores:** HP +${recipe.health || 0}, Energy +${recipe.energy || 0}`,
    ].filter(Boolean).join('\n');
  }
  return [
    `## ${recipe.name}`,
    `- **Type:** Crafting`,
    `- **Category:** ${recipe.category || '-'}`,
    `- **Output:** ${recipe.output_amount || 1}`,
    recipe.mastery_type ? `- **Unlock:** ${recipe.mastery_type} mastery level ${recipe.mastery_level || '-'}` : '',
    `- **Ingredients:** ${formatIngredients(recipe.ingredients)}`,
  ].filter(Boolean).join('\n');
}

async function directCropAnswer(query) {
  const text = normalizeText(query);
  if (!hasQuestionIntent(query, ['crop', 'seed', 'plant', 'profit', 'sell', 'grow', 'best'])) return null;
  const season = detectSeason(query);
  if (text.includes('best') || text.includes('profit')) {
    const params = [];
    let where = '';
    if (season) {
      params.push(`%${season}%`);
      where = 'WHERE season ILIKE $1';
    }
    const { rows } = await pool.query(
      `SELECT name, season, town_rank, grow_days, seed_price, sell_price, regrowth_days,
              (sell_price - seed_price) AS first_harvest_profit
       FROM crops
       ${where}
       ORDER BY first_harvest_profit DESC NULLS LAST, sell_price DESC NULLS LAST
       LIMIT 10`,
      params
    );
    if (!rows.length) return null;
    return [
      `## Best ${season ? season[0].toUpperCase() + season.slice(1) + ' ' : ''}Crop Profit`,
      '| Crop | Season | Rank | Grow days | Seed | Sell | First-harvest profit | Regrows |',
      '|---|---|---|---:|---:|---:|---:|---|',
      ...rows.map(r => `| ${r.name} | ${r.season} | ${r.town_rank} | ${r.grow_days || '-'} | ${r.seed_price || 0}g | ${r.sell_price || 0}g | ${r.first_harvest_profit || 0}g | ${r.regrowth_days ? `Every ${r.regrowth_days}d` : '-'} |`),
    ].join('\n');
  }
  const { rows } = await pool.query('SELECT name, type, season, town_rank, grow_days, seed_price, sell_price, price_bronze, price_silver, price_gold, price_osmium, regrowth_days, notes FROM crops ORDER BY name');
  const crop = pickBestRow(rows, query, ['name', 'type', 'season', 'town_rank', 'notes']);
  if (!crop) return null;
  return [
    `## ${crop.name}`,
    `- **Season:** ${crop.season}`,
    `- **Town rank:** ${crop.town_rank}`,
    `- **Grow time:** ${crop.grow_days || '-'} days${crop.regrowth_days ? `, regrows every ${crop.regrowth_days} days` : ''}`,
    `- **Seed price:** ${crop.seed_price || 0}g`,
    `- **Sell prices:** Base ${crop.sell_price || 0}g, Bronze ${crop.price_bronze || 0}g, Silver ${crop.price_silver || 0}g, Gold ${crop.price_gold || 0}g, Osmium ${crop.price_osmium || 0}g`,
    crop.notes ? `- **Notes:** ${crop.notes}` : '',
  ].filter(Boolean).join('\n');
}

async function directLocationAnswer(query) {
  if (!hasQuestionIntent(query, ['where', 'find', 'catch', 'location', 'floor', 'mine'])) return null;
  const [caves, forageables, collectibles] = await Promise.all([
    pool.query('SELECT item_name AS name, item_type, cave, floor_range, notes FROM cave_items ORDER BY item_name'),
    pool.query('SELECT name, season, location, area, notes, sell_price FROM forageables ORDER BY name'),
    pool.query('SELECT name, category, seasons, locations, time_of_day, sell_price, rarity FROM collectibles ORDER BY name'),
  ]);
  const rows = [
    ...caves.rows.map(row => ({ ...row, source: 'Cave Item' })),
    ...forageables.rows.map(row => ({ ...row, source: 'Forageable' })),
    ...collectibles.rows.map(row => ({ ...row, source: 'Collectible' })),
  ];
  const item = pickBestRow(rows, query, ['name', 'item_type', 'cave', 'floor_range', 'season', 'location', 'area', 'category', 'seasons', 'locations', 'time_of_day']);
  if (!item) return null;
  if (item.source === 'Cave Item') {
    return [
      `## ${item.name}`,
      `- **Type:** ${item.item_type}`,
      `- **Mine:** ${item.cave}`,
      `- **Floors:** ${item.floor_range}`,
      item.notes ? `- **Notes:** ${item.notes}` : '',
    ].filter(Boolean).join('\n');
  }
  if (item.source === 'Forageable') {
    return [
      `## ${item.name}`,
      `- **Type:** Forageable`,
      `- **Season:** ${item.season}`,
      `- **Location:** ${item.location}${item.area ? ` (${item.area})` : ''}`,
      item.sell_price != null ? `- **Sell price:** ${item.sell_price}g` : '',
      item.notes ? `- **Notes:** ${item.notes}` : '',
    ].filter(Boolean).join('\n');
  }
  return [
    `## ${item.name}`,
    `- **Category:** ${item.category}`,
    `- **Season:** ${item.seasons || 'Any season'}`,
    `- **Location:** ${item.locations || '-'}`,
    `- **Time:** ${item.time_of_day || 'Any time'}`,
    item.rarity ? `- **Rarity:** ${item.rarity}` : '',
    item.sell_price != null ? `- **Sell price:** ${item.sell_price}g` : '',
  ].filter(Boolean).join('\n');
}

async function tryDirectAnswer(query) {
  const text = normalizeText(query);
  if (hasAny(text, ['plan', 'today', 'layout', 'strategy', 'should i', 'what should'])) return null;
  const answerFns = [
    directFoodBuffAnswer,
    directNpcGiftAnswer,
    directRecipeAnswer,
    directCropAnswer,
    directLocationAnswer,
  ];
  for (const fn of answerFns) {
    const answer = await fn(query);
    if (answer) return `${answer}\n\n> Answered directly from the database, so no Gemini credits were used.`;
  }
  return null;
}

function classifySections(query, activeTab, hasImage) {
  const text = normalizeText(`${query} ${activeTab || ''}`);
  const keys = new Set();
  const foodIntent = hasAny(text, ['cook', 'cooking', 'food', 'dish', 'utensil', 'buff', 'energy', 'health']);

  if (hasImage) keys.add('goddess_offerings').add('collectibles').add('forageables');
  if (hasAny(text, ['crop', 'farm', 'seed', 'plant', 'profit', 'grow', 'regrow', 'harvest', 'layout'])) keys.add('crops');
  if (hasAny(text, ['mine', 'cave', 'ore', 'gem', 'geode', 'floor', 'mining'])) keys.add('cave_items').add('tools');
  if (hasAny(text, ['forage', 'scavenge', 'found', 'find', 'location', 'where'])) keys.add('forageables');
  if (hasAny(text, ['npc', 'gift', 'love', 'liked', 'birthday', 'schedule', 'talk', 'friend'])) keys.add('npcs');
  if (!foodIntent && hasAny(text, ['fish', 'bug', 'insect', 'critter', 'museum', 'collect', 'fossil', 'artifact', 'catch'])) keys.add('collectibles');
  if (foodIntent) keys.add('cooking_recipes');
  if (hasAny(text, ['craft', 'crafting', 'recipe', 'build', 'make', 'ingredient', 'furnace'])) keys.add('crafting_recipes');
  if (hasAny(text, ['offering', 'bundle', 'altar', 'goddess', 'fairy', 'temple', 'donate'])) keys.add('goddess_offerings');
  if (hasAny(text, ['animal', 'ranch', 'milk', 'egg', 'wool', 'coop', 'barn'])) keys.add('animal_products');
  if (hasAny(text, ['artisan', 'keg', 'jar', 'mason', 'cheese', 'mayonnaise', 'honey', 'wine'])) keys.add('artisan_products');
  if (hasAny(text, ['tool', 'upgrade', 'axe', 'pickaxe', 'hoe', 'scythe', 'pole', 'net'])) keys.add('tools');
  if (hasAny(text, ['today', 'daily', 'plan', 'itinerary', 'morning', 'afternoon', 'evening', 'night'])) {
    keys.add('crops').add('forageables').add('collectibles').add('npcs').add('goddess_offerings');
  }

  return keys;
}

function scoreLine(line, terms) {
  const text = normalizeText(line);
  let score = 0;
  for (const term of terms) {
    if (text.includes(term)) score += term.length > 5 ? 3 : 2;
  }
  return score;
}

function renderSection(section, terms, forceFull) {
  if (forceFull && section.text.length <= 60000) return section.text;

  const scored = section.lines
    .map((line, index) => ({ line, index, score: scoreLine(line, terms) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, forceFull ? 80 : 30)
    .sort((a, b) => a.index - b.index)
    .map(item => item.line);

  if (scored.length > 0) return `${section.heading}\n${scored.join('\n')}`;
  if (forceFull) return `${section.heading}\n${section.lines.slice(0, 35).join('\n')}`;
  return '';
}

async function buildContextSections() {
  if (cachedAISections && (Date.now() - cachedAISectionsTime < AI_CONTEXT_TTL_MS)) {
    return cachedAISections;
  }

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
    { key: 'crops', heading: '# CROPS', lines: cropLines },
    { key: 'cave_items', heading: '# CAVE ITEMS', lines: caveLines },
    { key: 'forageables', heading: '# FORAGEABLES', lines: forageLines },
    { key: 'collectibles', heading: '# COLLECTIBLES (fish, insects, sea critters, fossils, artifacts, gems)', lines: collectibleLines },
    { key: 'crafting_recipes', heading: '# CRAFTING RECIPES', lines: craftingLines },
    { key: 'cooking_recipes', heading: '# COOKING RECIPES (food buffs: skill/stat bonuses, HP & energy restore)', lines: cookingLines },
    { key: 'npcs', heading: '# NPCS', lines: npcLines },
    { key: 'goddess_offerings', heading: '# GODDESS OFFERINGS (bundles)', lines: offeringLines },
    { key: 'animal_products', heading: '# ANIMAL PRODUCTS', lines: animalLines },
    { key: 'artisan_products', heading: '# ARTISAN PRODUCTS', lines: artisanLines },
    { key: 'tools', heading: '# TOOLS AND EQUIPMENT UPGRADES', lines: toolLines },
  ];
  if (sections.every(section => section.lines.length === 0)) {
    throw new Error('database context is empty — DB is unreachable or unseeded');
  }

  cachedAISections = sections.map(section => ({
    ...section,
    text: `${section.heading}\n${section.lines.join('\n')}`,
  }));
  cachedAISectionsTime = Date.now();
  return cachedAISections;
}

async function buildRelevantContext(query, { activeTab, hasImage } = {}) {
  const sections = await buildContextSections();
  const terms = extractTerms(query);
  const forcedKeys = classifySections(query, activeTab, hasImage);
  const retrievedDocs = await retrieveContextDocs(query);
  const retrievedContext = renderRetrievedContext(retrievedDocs);

  let chunks = sections
    .map(section => renderSection(section, terms, forcedKeys.has(section.key)))
    .filter(Boolean);

  if (chunks.length === 0) {
    chunks = sections
      .map(section => renderSection(section, terms, true))
      .filter(Boolean)
      .slice(0, 4);
  }

  let result = [retrievedContext, ...chunks].filter(Boolean).join('\n\n');
  if (result.length > MAX_CONTEXT_CHARS) {
    const compactChunks = sections
      .map(section => renderSection(section, terms, forcedKeys.has(section.key)))
      .filter(Boolean);
    result = [retrievedContext, ...compactChunks].filter(Boolean).join('\n\n').slice(0, MAX_CONTEXT_CHARS);
    result += '\n\n[Context trimmed to the most relevant database rows.]';
  }

  return { text: result, retrievedDocs: retrievedDocs.length };
}

async function getDonatedString(userId) {
  if (!userId) return '';
  try {
    const { rows } = await pool.query('SELECT items FROM user_offerings WHERE user_id = $1', [userId]);
    let items = rows.length > 0 ? rows[0].items : [];
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch(e) { items = []; }
    }
    if (Array.isArray(items) && items.length > 0) {
      return `\n[COMPLETED OFFERINGS: ${items.join(', ')}]\n`;
    }
  } catch(e) {}
  return '';
}

// Hard cap on question length — everything past this is either an accident or
// an attempt to burn API credits; real questions fit comfortably under it.
const MAX_QUERY_CHARS = 500;

// GET /api/search/index
// Returns a cached global search array for the Command Palette.
let cachedGlobalIndex = null;
let cachedGlobalIndexTime = 0;

router.get('/index', async (req, res) => {
  try {
    const CACHE_TTL = 60 * 60 * 1000;
    if (cachedGlobalIndex && (Date.now() - cachedGlobalIndexTime < CACHE_TTL)) {
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
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');

    let dynamicPrompt = SYSTEM_PROMPT;
    dynamicPrompt += `\n\nCRITICAL TOOL INSTRUCTIONS:
- IMAGE PROCESSING: If the user uploads an image/screenshot, use your vision capabilities to identify the game items shown. If the user asks you to process them or mark them, automatically use the 'mark_offering_complete' tool for every single identified item.
- If the user asks to set a reminder, add a task, or do something related to a checklist, YOU MUST use the 'add_custom_task' tool.
- If the user asks to mark an offering as complete or donated, YOU MUST use the 'mark_offering_complete' tool.
- Tool execution is independent of the game database context. NEVER decline a task simply because it is not found in the context.`;

    const historyParams = (req.body.history || [])
      .slice(-MAX_HISTORY_MESSAGES)
      .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || '').slice(0, MAX_HISTORY_CHARS) }]
    }));
    
    let stateString = '';
    if (gameState) {
      stateString = `\n[CURRENT GAME STATE: ${gameState.season} Day ${gameState.day || 1}, Time: ${gameState.time}, Weather: ${gameState.weather}, Town Rank: ${gameState.rank || 'F'}]\n`;
    }

    const userParts = [{ text: `User Request: ${trimmedQuery}${stateString}${donatedString}\n\n---\nFocused Game Database Context (use only if relevant to the request):\n${context}` }];
    
    if (image) {
      try {
        const matches = image.match(/^data:(image\/[a-zA-Z0-9+]+);base64,(.*)$/);
        if (matches && matches.length === 3) {
          userParts.unshift({
            inlineData: {
              mimeType: matches[1],
              data: matches[2]
            }
          });
        }
      } catch(e) {
        console.error('Failed to parse image data', e);
      }
    }

    const stream = await ai.models.generateContentStream({
      model: MODEL,
      contents: [
        ...historyParams,
        { role: 'user', parts: userParts }
      ],
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
    const logId = await logSearch(user, trimmedQuery, null, 'ai');

    let fullResponse = '';
    let usedToolCall = false;

    async function processStream(streamObj) {
      let yielded = false;
      for await (const chunk of streamObj) {
        if (abort.signal.aborted) break;
        if (chunk.functionCalls && chunk.functionCalls.length > 0) {
          usedToolCall = true;
          yielded = true;
          for (const call of chunk.functionCalls) {
            if (call.name === 'mark_offering_complete') {
              const itemName = call.args.itemName;
              let msg = '';
              if (!userId) {
                msg = `\n\n❌ **Action Failed:** You must be logged in to mark offerings as complete.`;
              } else {
                const { rows } = await pool.query('SELECT items FROM user_offerings WHERE user_id = $1', [userId]);
                let items = rows.length > 0 ? rows[0].items : [];
                if (typeof items === 'string') {
                  try { items = JSON.parse(items); } catch(e) { items = []; }
                }
                if (!Array.isArray(items)) items = [];
                const norm = itemName.trim().toLowerCase();
                if (!items.includes(norm)) items.push(norm);
                await pool.query(
                  'INSERT INTO user_offerings (user_id, items) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET items = EXCLUDED.items',
                  [userId, JSON.stringify(items)]
                );
                msg = `\n\n✅ **Action Taken:** Marked *"${itemName}"* as completed!`;
              }
              fullResponse += msg;
              res.write(msg);
            } else if (call.name === 'add_custom_task') {
              const taskName = call.args.taskName;
              let msg = '';
              if (!userId) {
                msg = `\n\n❌ **Action Failed:** You must be logged in to save tasks to your itinerary.`;
              } else {
                const { rows } = await pool.query('SELECT tasks FROM user_checklists WHERE user_id = $1', [userId]);
                let tasks = rows.length > 0 ? rows[0].tasks : [];
                if (typeof tasks === 'string') {
                  try { tasks = JSON.parse(tasks); } catch(e) { tasks = []; }
                }
                if (!Array.isArray(tasks)) tasks = [];
                tasks.push({ id: Date.now().toString(), text: taskName, completed: false });
                await pool.query(
                  'INSERT INTO user_checklists (user_id, tasks) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET tasks = EXCLUDED.tasks',
                  [userId, JSON.stringify(tasks)]
                );
                msg = `\n\n✅ **Action Taken:** Added *"${taskName}"* to your tasks!`;
              }
              fullResponse += msg;
              res.write(msg);
            }
          }
        }
        try {
          if (chunk.text) {
            yielded = true;
            fullResponse += chunk.text;
            res.write(chunk.text);
          }
        } catch (e) {
        }
      }
      return yielded;
    }

    let success = await processStream(stream);

    // If Flash returned an empty response, it was likely overwhelmed by the huge context
    // when trying to answer a simple tool-call prompt. Retry with no context!
    if (!success && !abort.signal.aborted) {
      console.log('Model returned empty response. Retrying without context...');
      const fallbackStream = await ai.models.generateContentStream({
        model: MODEL,
        contents: `User Request: ${trimmedQuery}`,
        config: {
          systemInstruction: dynamicPrompt,
          tools: [{
            functionDeclarations: [
              {
                name: "mark_offering_complete",
                description: "Mark a Lake Temple Goddess Offering item as completed/donated.",
                parameters: { type: "OBJECT", properties: { itemName: { type: "STRING" } }, required: ["itemName"] }
              },
              {
                name: "add_custom_task",
                description: "Add a task to the user's custom daily checklist. Use this when the user asks to be reminded to do something.",
                parameters: { type: "OBJECT", properties: { taskName: { type: "STRING" } }, required: ["taskName"] }
              }
            ]
          }]
        }
      });
      success = await processStream(fallbackStream);
      
      if (!success) {
        const msg = `\n\n⚠️ The AI encountered an issue processing your request. Please try rephrasing.`;
        fullResponse += msg;
        res.write(msg);
      }
    }
    res.end();

    // Save the AI response asynchronously
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
