const {
  DIRECT_ANSWER_MIN_SCORE,
  DIRECT_INTENT_WORDS,
  STOPWORDS,
} = require('./config');

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

module.exports = {
  extractTerms,
  formatIngredients,
  getDirectTerms,
  hasAny,
  normalizeText,
  parseMaybeJson,
  pickBestRow,
  scoreLine: (line, terms) => {
    const text = normalizeText(line);
    let score = 0;
    for (const term of terms) {
      if (text.includes(term)) score += term.length > 5 ? 3 : 2;
    }
    return score;
  },
  scoreRow,
};
