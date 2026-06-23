const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/requireAuth');
const supabase = require('../lib/supabase');
const settings = require('../lib/settings');

async function queryWithSourceFallback(sql, params, fallbackSql, fallbackParams = params) {
  try {
    return await pool.query(sql, params);
  } catch (err) {
    if (err.code !== '42703') throw err;
    return pool.query(fallbackSql, fallbackParams);
  }
}

// GET /api/admin/me  — lightweight role check (used by AuthContext on login)
router.get('/me', requireAuth, (req, res) => {
  res.json({ isAdmin: req.isAdmin });
});

// GET /api/admin/stats
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [usersRes, adminsRes, searchesRes, todayRes, limits] = await Promise.all([
      // Supabase lists all auth users via admin API
      supabase.auth.admin.listUsers({ perPage: 1 }),
      pool.query("SELECT COUNT(*) FROM user_roles WHERE role = 'admin'"),
      queryWithSourceFallback(
        "SELECT COUNT(*) FROM search_logs WHERE source = 'ai'",
        [],
        'SELECT COUNT(*) FROM search_logs',
        []
      ),
      queryWithSourceFallback(
        "SELECT COUNT(*) FROM search_logs WHERE source = 'ai' AND created_at >= CURRENT_DATE",
        [],
        "SELECT COUNT(*) FROM search_logs WHERE created_at >= CURRENT_DATE",
        []
      ),
      settings.getSearchLimits(),
    ]);

    res.json({
      totalUsers:    usersRes.data?.total ?? null,
      totalAdmins:   parseInt(adminsRes.rows[0].count, 10),
      totalSearches: parseInt(searchesRes.rows[0].count, 10),
      searchesToday: parseInt(todayRes.rows[0].count, 10),
      // AI-search testing limits (editable below on this tab)
      limitsEnabled:    limits.enabled,
      globalDailyLimit: limits.globalLimit,
      defaultUserLimit: limits.defaultUserLimit,
    });
  } catch (err) {
    console.error('GET /api/admin/stats failed:', err.message);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// GET /api/admin/users  — full user list with roles, limits, and today's usage
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const [authRes, roleRes, todayRes, limits] = await Promise.all([
      supabase.auth.admin.listUsers({ perPage: 1000 }),
      pool.query('SELECT user_id, role, daily_search_limit FROM user_roles'),
      queryWithSourceFallback(
        "SELECT user_id, COUNT(*) AS count FROM search_logs WHERE source = 'ai' AND created_at >= CURRENT_DATE GROUP BY user_id",
        [],
        'SELECT user_id, COUNT(*) AS count FROM search_logs WHERE created_at >= CURRENT_DATE GROUP BY user_id',
        []
      ),
      settings.getSearchLimits(),
    ]);
    if (authRes.error) throw authRes.error;

    const roleMap = {};
    for (const r of roleRes.rows) {
      roleMap[r.user_id] = { role: r.role, dailyLimit: r.daily_search_limit };
    }
    const todayMap = {};
    for (const r of todayRes.rows) {
      todayMap[r.user_id] = parseInt(r.count, 10);
    }

    const users = (authRes.data.users || []).map(u => ({
      id:            u.id,
      email:         u.email,
      role:          roleMap[u.id]?.role || 'user',
      dailyLimit:    roleMap[u.id]?.dailyLimit ?? null,
      searchesToday: todayMap[u.id] || 0,
      createdAt:     u.created_at,
    }));

    // Include the current per-user default + master toggle so the UI can show
    // each user's *effective* limit (an explicit null falls back to the default).
    res.json({
      users,
      defaultUserLimit: limits.defaultUserLimit,
      limitsEnabled:    limits.enabled,
    });
  } catch (err) {
    console.error('GET /api/admin/users failed:', err.message);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

// PATCH /api/admin/settings  { globalDailyLimit?, defaultUserLimit?, limitsEnabled? }
// Updates the AI-search testing limits. Numeric limits accept a positive integer
// or null (= no cap for that scope). Any subset of fields may be sent.
router.patch('/settings', requireAdmin, async (req, res) => {
  const { globalDailyLimit, defaultUserLimit, limitsEnabled } = req.body || {};

  // null/'' → null (no cap); a positive integer → that cap; anything else → invalid.
  function normalizeLimit(v) {
    if (v === null || v === undefined || v === '') return null;
    const n = parseInt(v, 10);
    if (!Number.isFinite(n) || n < 1) return undefined;   // sentinel: invalid
    return n;
  }

  try {
    if (globalDailyLimit !== undefined) {
      const v = normalizeLimit(globalDailyLimit);
      if (v === undefined) return res.status(400).json({ error: 'globalDailyLimit must be a positive integer or null' });
      await settings.set('global_daily_search_limit', v);
    }
    if (defaultUserLimit !== undefined) {
      const v = normalizeLimit(defaultUserLimit);
      if (v === undefined) return res.status(400).json({ error: 'defaultUserLimit must be a positive integer or null' });
      await settings.set('default_user_daily_search_limit', v);
    }
    if (limitsEnabled !== undefined) {
      await settings.set('search_limits_enabled', limitsEnabled ? 'true' : 'false');
    }

    res.json({ ok: true, ...(await settings.getSearchLimits()) });
  } catch (err) {
    console.error('PATCH /api/admin/settings failed:', err.message);
    if (err.code === '42P01') {
      return res.status(503).json({ error: 'Settings table not found — run the DB migration (node migrate.js) first.' });
    }
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// PATCH /api/admin/users/:id/role  { role: 'admin' | 'user' }
router.patch('/users/:id/role', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ error: 'role must be "admin" or "user"' });
  }

  // Prevent self-demotion
  if (id === req.user.id) {
    return res.status(400).json({ error: 'Cannot change your own role' });
  }

  try {
    if (role === 'admin') {
      // Get user email from Supabase for the user_roles record
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(id);
      if (userError) throw userError;
      const email = userData?.user?.email || '';

      await pool.query(
        `INSERT INTO user_roles (user_id, role, email, created_at)
         VALUES ($1, 'admin', $2, NOW())
         ON CONFLICT (user_id) DO UPDATE SET role = 'admin', email = $2`,
        [id, email],
      );
    } else {
      // Demote in place — deleting the row would also wipe the user's
      // daily_search_limit and stored email.
      await pool.query("UPDATE user_roles SET role = 'user' WHERE user_id = $1", [id]);
    }

    res.json({ ok: true, role });
  } catch (err) {
    console.error('PATCH /api/admin/users/:id/role failed:', err.message);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// PATCH /api/admin/users/:id/limit  { limit: number | null }
router.patch('/users/:id/limit', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { limit } = req.body;

  if (limit !== null && limit !== undefined) {
    const n = parseInt(limit, 10);
    if (!Number.isFinite(n) || n < 1) {
      return res.status(400).json({ error: 'limit must be a positive integer or null' });
    }
  }

  const finalLimit = (limit === null || limit === undefined || limit === '') ? null : parseInt(limit, 10);

  try {
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(id);
    if (userError) throw userError;
    const email = userData?.user?.email || '';

    await pool.query(
      `INSERT INTO user_roles (user_id, role, email, daily_search_limit, created_at)
       VALUES ($1, 'user', $2, $3, NOW())
       ON CONFLICT (user_id) DO UPDATE SET daily_search_limit = $3, email = COALESCE(NULLIF(user_roles.email, ''), $2)`,
      [id, email, finalLimit],
    );

    res.json({ ok: true, limit: finalLimit });
  } catch (err) {
    console.error('PATCH /api/admin/users/:id/limit failed:', err.message);
    res.status(500).json({ error: 'Failed to update limit' });
  }
});

// GET /api/admin/search-logs?page=1&limit=20
router.get('/search-logs', requireAdmin, async (req, res) => {
  // Non-numeric input parses to NaN, which would reach LIMIT/OFFSET as a SQL
  // error — fall back to defaults and clamp to sane ranges instead.
  const toInt = (v, def) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : def;
  };
  const page  = Math.max(1, toInt(req.query.page, 1));
  const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));
  const offset = (page - 1) * limit;

  try {
    const [logsRes, countRes] = await Promise.all([
      pool.query(
        `SELECT sl.id, sl.user_id, sl.query, sl.created_at,
                COALESCE(sl.user_email, ur.email) AS user_email
         FROM search_logs sl
         LEFT JOIN user_roles ur ON ur.user_id = sl.user_id
         ORDER BY sl.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
      pool.query('SELECT COUNT(*) FROM search_logs'),
    ]);

    res.json({
      logs: logsRes.rows.map(r => ({
        id:        r.id,
        userId:    r.user_id,
        userEmail: r.user_email || null,
        query:     r.query,
        createdAt: r.created_at,
      })),
      total: parseInt(countRes.rows[0].count, 10),
      page,
      limit,
    });
  } catch (err) {
    console.error('GET /api/admin/search-logs failed:', err.message);
    res.status(500).json({ error: 'Failed to load search logs' });
  }
});

// GET /api/admin/ai-metrics?limit=50
// Recent AI-processing metrics plus lightweight rollups.
router.get('/ai-metrics', requireAdmin, async (req, res) => {
  const toInt = (v, def) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : def;
  };
  const limit = Math.min(200, Math.max(1, toInt(req.query.limit, 50)));

  try {
    const [recentRes, summaryRes, sourceRes] = await Promise.all([
      pool.query(
        `SELECT id, search_log_id, user_id, source, model, status, query_chars,
                history_messages, history_chars, context_chars, retrieved_docs,
                response_chars, duration_ms, cache_hit, used_tool_call, aborted,
                error, created_at
         FROM ai_request_metrics
         ORDER BY created_at DESC
         LIMIT $1`,
        [limit],
      ),
      pool.query(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE source = 'ai')::int AS ai_calls,
           COUNT(*) FILTER (WHERE source = 'direct')::int AS direct_answers,
           COUNT(*) FILTER (WHERE source = 'cache')::int AS cache_hits,
           COUNT(*) FILTER (WHERE aborted)::int AS aborted,
           ROUND(AVG(duration_ms))::int AS avg_duration_ms,
           ROUND(AVG(context_chars))::int AS avg_context_chars,
           ROUND(AVG(retrieved_docs))::int AS avg_retrieved_docs
         FROM ai_request_metrics
         WHERE created_at >= NOW() - INTERVAL '24 hours'`,
      ),
      pool.query(
        `SELECT source, COUNT(*)::int AS count,
                ROUND(AVG(duration_ms))::int AS avg_duration_ms,
                ROUND(AVG(context_chars))::int AS avg_context_chars
         FROM ai_request_metrics
         WHERE created_at >= NOW() - INTERVAL '24 hours'
         GROUP BY source
         ORDER BY count DESC`,
      ),
    ]);

    res.json({
      summary24h: summaryRes.rows[0],
      bySource24h: sourceRes.rows,
      recent: recentRes.rows,
    });
  } catch (err) {
    console.error('GET /api/admin/ai-metrics failed:', err.message);
    if (err.code === '42P01') {
      return res.status(503).json({ error: 'AI metrics table not found — run node migrate.js first.' });
    }
    res.status(500).json({ error: 'Failed to load AI metrics' });
  }
});

// GET /api/admin/prompt-analytics
// Higher-level prompt quality/cost signals for deciding what to optimize next.
router.get('/prompt-analytics', requireAdmin, async (req, res) => {
  try {
    const [topQuestionsRes, costlyRes, feedbackRes, feedbackSummaryRes, directSavingsRes] = await Promise.all([
      pool.query(
        `SELECT LOWER(TRIM(query)) AS query, COUNT(*)::int AS count,
                MAX(created_at) AS last_seen,
                COUNT(*) FILTER (WHERE source = 'direct')::int AS direct_count,
                COUNT(*) FILTER (WHERE source = 'cache')::int AS cache_count,
                COUNT(*) FILTER (WHERE source = 'ai')::int AS ai_count
         FROM search_logs
         WHERE created_at >= NOW() - INTERVAL '30 days'
         GROUP BY LOWER(TRIM(query))
         ORDER BY count DESC, last_seen DESC
         LIMIT 20`,
      ),
      pool.query(
        `SELECT sl.id, sl.query, sl.source, sl.created_at,
                arm.duration_ms, arm.context_chars, arm.retrieved_docs, arm.response_chars, arm.status
         FROM ai_request_metrics arm
         LEFT JOIN search_logs sl ON sl.id = arm.search_log_id
         WHERE arm.created_at >= NOW() - INTERVAL '7 days'
         ORDER BY arm.context_chars DESC NULLS LAST, arm.duration_ms DESC NULLS LAST
         LIMIT 20`,
      ),
      pool.query(
        `SELECT f.id, f.rating, f.note, f.created_at, sl.query, sl.response, sl.source
         FROM ai_answer_feedback f
         LEFT JOIN search_logs sl ON sl.id = f.search_log_id
         ORDER BY f.created_at DESC
         LIMIT 30`,
      ),
      pool.query(
        `SELECT rating, COUNT(*)::int AS count
         FROM ai_answer_feedback
         WHERE created_at >= NOW() - INTERVAL '30 days'
         GROUP BY rating
         ORDER BY count DESC`,
      ),
      pool.query(
        `SELECT source, COUNT(*)::int AS count
         FROM search_logs
         WHERE created_at >= NOW() - INTERVAL '30 days'
         GROUP BY source
         ORDER BY count DESC`,
      ),
    ]);

    res.json({
      topQuestions: topQuestionsRes.rows,
      costlyPrompts: costlyRes.rows,
      recentFeedback: feedbackRes.rows,
      feedbackSummary: feedbackSummaryRes.rows,
      sourceMix30d: directSavingsRes.rows,
    });
  } catch (err) {
    console.error('GET /api/admin/prompt-analytics failed:', err.message);
    if (err.code === '42P01') {
      return res.status(503).json({ error: 'Prompt analytics table missing - run node migrate.js first.' });
    }
    res.status(500).json({ error: 'Failed to load prompt analytics' });
  }
});

module.exports = router;
