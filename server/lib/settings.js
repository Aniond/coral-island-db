// ── App settings (key/value) ─────────────────────────────────────────────────
// Thin helper over the app_settings table. Reads are defensive: if the table
// doesn't exist yet (deploy landed before `node migrate.js` was run) we fall back
// to the safe defaults below rather than 500-ing the search route or admin page.
const pool = require('../db');

// Used when a key is ABSENT (table missing, or row never inserted). A key that is
// present but null/'' means "explicitly no cap" and is NOT overridden by these.
const FALLBACK = {
  globalLimit: 50,
  defaultUserLimit: 50,
  enabled: true,
};

// Fetch all settings as a plain { key: value } map. Returns {} if the table is
// missing (pre-migration) — callers apply their own fallbacks.
async function getAll() {
  try {
    const { rows } = await pool.query('SELECT key, value FROM app_settings');
    const map = {};
    for (const r of rows) map[r.key] = r.value;
    return map;
  } catch (err) {
    if (err.code === '42P01') return {};   // undefined_table — not migrated yet
    throw err;
  }
}

// key absent → fallbackWhenAbsent; present-but-empty → null (no cap); else int.
function intOrNull(map, key, fallbackWhenAbsent) {
  if (!(key in map)) return fallbackWhenAbsent;
  const v = map[key];
  if (v == null || v === '') return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

// Normalized view of the AI-search testing limits, with fallbacks applied.
async function getSearchLimits() {
  const map = await getAll();
  return {
    enabled:          'search_limits_enabled' in map ? map.search_limits_enabled !== 'false' : FALLBACK.enabled,
    globalLimit:      intOrNull(map, 'global_daily_search_limit', FALLBACK.globalLimit),
    defaultUserLimit: intOrNull(map, 'default_user_daily_search_limit', FALLBACK.defaultUserLimit),
  };
}

// Upsert a single setting. `value` of null is stored as SQL NULL (= "no cap").
async function set(key, value) {
  await pool.query(
    `INSERT INTO app_settings (key, value, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, value == null ? null : String(value)],
  );
}

module.exports = { getAll, getSearchLimits, set, FALLBACK };
