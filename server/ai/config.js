const MODEL = 'gemini-2.5-flash';

const AI_CONTEXT_TTL_MS = 60 * 60 * 1000;
const MAX_CONTEXT_CHARS = 85000;
const MAX_HISTORY_MESSAGES = 6;
const MAX_HISTORY_CHARS = 1800;
const MAX_IMAGE_CHARS = 4 * 1024 * 1024;
const MAX_QUERY_CHARS = 500;
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

module.exports = {
  MODEL,
  AI_CONTEXT_TTL_MS,
  MAX_CONTEXT_CHARS,
  MAX_HISTORY_MESSAGES,
  MAX_HISTORY_CHARS,
  MAX_IMAGE_CHARS,
  MAX_QUERY_CHARS,
  RETRIEVAL_LIMIT,
  DIRECT_ANSWER_MIN_SCORE,
  AI_CACHE_TTL_MS,
  AI_CACHE_MAX_ENTRIES,
  STOPWORDS,
  DIRECT_INTENT_WORDS,
};
