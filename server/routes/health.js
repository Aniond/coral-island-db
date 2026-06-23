const express = require('express');
const pool = require('../db');

const router = express.Router();

const REQUIRED_TABLES = [
  'crops',
  'cave_items',
  'forageables',
  'collectibles',
  'cooking_recipes',
  'crafting_recipes',
  'npcs',
  'search_logs',
  'ai_request_metrics',
  'ai_answer_feedback',
  'schema_migrations',
];

async function checkDatabase() {
  const started = Date.now();
  const { rows } = await pool.query('SELECT NOW() AS now');
  return { ok: true, latencyMs: Date.now() - started, now: rows[0].now };
}

async function checkTables() {
  const { rows } = await pool.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name = ANY($1::text[])`,
    [REQUIRED_TABLES],
  );
  const present = new Set(rows.map(row => row.table_name));
  const missing = REQUIRED_TABLES.filter(name => !present.has(name));
  return { ok: missing.length === 0, missing };
}

async function checkCounts() {
  const names = ['crops', 'npcs', 'collectibles', 'cooking_recipes', 'crafting_recipes'];
  const counts = {};
  await Promise.all(names.map(async (name) => {
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS count FROM ${name}`);
    counts[name] = rows[0].count;
  }));
  return {
    ok: Object.values(counts).every(count => count > 0),
    counts,
  };
}

async function checkMigrations() {
  const { rows } = await pool.query(
    `SELECT filename, applied_at
     FROM schema_migrations
     ORDER BY filename DESC
     LIMIT 5`,
  );
  return { ok: true, recent: rows };
}

router.get('/', (req, res) => {
  res.json({ status: 'ok', app: 'Coral Island DB', version: 2 });
});

router.get('/deep', async (req, res) => {
  const started = Date.now();
  const checks = {};

  try {
    checks.database = await checkDatabase();
    checks.tables = await checkTables();
    checks.counts = checks.tables.ok ? await checkCounts() : { ok: false, skipped: true };
    checks.migrations = checks.tables.missing.includes('schema_migrations')
      ? { ok: false, skipped: true }
      : await checkMigrations();

    const ok = Object.values(checks).every(check => check.ok);
    res.status(ok ? 200 : 503).json({
      status: ok ? 'ok' : 'degraded',
      app: 'Coral Island DB',
      version: 2,
      durationMs: Date.now() - started,
      checks,
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      app: 'Coral Island DB',
      version: 2,
      durationMs: Date.now() - started,
      error: err.message,
      checks,
    });
  }
});

module.exports = router;
