const pool = require('../db');
const { MAX_HISTORY_CHARS, MAX_HISTORY_MESSAGES } = require('./config');

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

module.exports = {
  countAiSearchesToday,
  getHistoryStats,
  logRequestMetric,
  logSearch,
};
