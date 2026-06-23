const { AI_CACHE_MAX_ENTRIES, AI_CACHE_TTL_MS } = require('./config');

const aiResponseCache = new Map();

function normalizeCacheText(value) {
  return String(value || '').toLowerCase();
}

function cacheKeyFor(query, gameState, donatedString) {
  const state = gameState
    ? `${gameState.season || ''}|${gameState.day || ''}|${gameState.time || ''}|${gameState.weather || ''}|${gameState.rank || ''}`
    : '';
  return `${normalizeCacheText(query).replace(/\s+/g, ' ').trim()}::${state}::${donatedString || ''}`;
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

module.exports = {
  cacheKeyFor,
  getCachedAnswer,
  setCachedAnswer,
};
