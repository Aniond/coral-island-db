const express = require('express');
const router = express.Router();
const pool = require('../db');
const supabase = require('../lib/supabase');

// @anthropic-ai/sdk exports the client under different shapes across versions;
// resolve defensively so this works regardless.
const sdk = require('@anthropic-ai/sdk');
const Anthropic = sdk.Anthropic || sdk.default || sdk;

// Current Sonnet. (The original spec named claude-sonnet-4-20250514, which is the
// deprecated Sonnet 4; claude-sonnet-4-6 is its supported replacement.)
const MODEL = 'claude-sonnet-4-6';

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
  '- Be concise. Avoid filler phrases like "Great question!" or "I hope this helps!".';

// Pull the whole database and render it as compact text for the model.
async function buildContext() {
  const [crops, caves, forageables, npcs] = await Promise.all([
    pool.query('SELECT name, type, season, town_rank, grow_days, sell_price, regrowth_days, notes FROM crops ORDER BY id'),
    pool.query('SELECT cave, item_name, item_type, floor_range, notes FROM cave_items ORDER BY id'),
    pool.query('SELECT name, season, location, area, notes FROM forageables ORDER BY id'),
    pool.query('SELECT name, role, location, schedule, loved_gifts, liked_gifts, quest_summary FROM npcs ORDER BY id'),
  ]);

  const cropLines = crops.rows.map(c =>
    `- ${c.name} (${c.type}, ${c.season}, rank ${c.town_rank}): ` +
    `${c.grow_days != null ? c.grow_days + 'd grow' : 'no grow time'}, sells ${c.sell_price}g` +
    `${c.regrowth_days != null ? `, regrows every ${c.regrowth_days}d` : ''}` +
    `${c.notes ? `. ${c.notes}` : ''}`);

  const caveLines = caves.rows.map(c =>
    `- ${c.item_name} (${c.item_type}) — ${c.cave} mine, floors ${c.floor_range}` +
    `${c.notes ? `. ${c.notes}` : ''}`);

  const forageLines = forageables.rows.map(f =>
    `- ${f.name} (${f.season}) — ${f.location} [${f.area}]${f.notes ? `. ${f.notes}` : ''}`);

  const npcLines = npcs.rows.map(n =>
    `- ${n.name} (${n.role}) @ ${n.location}. Schedule: ${n.schedule}. ` +
    `Loved gifts: ${n.loved_gifts}. Liked: ${n.liked_gifts}. Quest: ${n.quest_summary}`);

  return [
    `# CROPS\n${cropLines.join('\n')}`,
    `# CAVE ITEMS\n${caveLines.join('\n')}`,
    `# FORAGEABLES\n${forageLines.join('\n')}`,
    `# NPCS\n${npcLines.join('\n')}`,
  ].join('\n\n');
}

// Resolve caller's user_id from Bearer token if present (best-effort, non-blocking).
async function resolveUserId(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
  if (!token) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser(token);
    return user?.id || null;
  } catch { return null; }
}

// POST /api/search  { query }
// Streams the AI answer back as plain text. Requires a valid auth token.
router.post('/', async (req, res) => {
  const query = req.body && req.body.query;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Missing "query" in request body' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured' });
  }

  // Require auth — AI features are locked behind registered accounts.
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
  if (!token) {
    return res.status(401).json({ error: 'Sign in to use AI search' });
  }
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  const userId = user.id;

  try {
    // Check per-user daily limit before hitting the model
    const { rows: limitRows } = await pool.query(
      'SELECT daily_search_limit FROM user_roles WHERE user_id = $1',
      [userId]
    );
    const dailyLimit = limitRows.length > 0 ? limitRows[0].daily_search_limit : null;
    if (dailyLimit !== null) {
      const { rows: countRows } = await pool.query(
        "SELECT COUNT(*) FROM search_logs WHERE user_id = $1 AND created_at >= CURRENT_DATE",
        [userId]
      );
      const usedToday = parseInt(countRows[0].count, 10);
      if (usedToday >= dailyLimit) {
        return res.status(429).json({
          error: `Daily limit reached — you've used all ${dailyLimit} AI searches for today. Try again tomorrow.`,
        });
      }
    }

    const context = await buildContext();
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');

    const stream = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: `Game database context:\n\n${context}\n\nQuestion: ${query.trim()}` },
      ],
      stream: true,
    });

    // Log the search (fire-and-forget — don't block the stream)
    pool.query('INSERT INTO search_logs (user_id, query, created_at) VALUES ($1, $2, NOW())', [userId, query.trim()])
      .catch(e => console.error('search log insert failed:', e.message));

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta && event.delta.type === 'text_delta') {
        res.write(event.delta.text);
      }
    }
    res.end();
  } catch (err) {
    console.error('POST /api/search failed:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'AI search failed' });
    } else {
      res.end();
    }
  }
});

module.exports = router;
