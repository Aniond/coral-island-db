const pool = require('../db');
const {
  formatIngredients,
  getDirectTerms,
  hasAny,
  normalizeText,
  pickBestRow,
  scoreRow,
} = require('./text');

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

module.exports = {
  directCropAnswer,
  directFoodBuffAnswer,
  directLocationAnswer,
  directNpcGiftAnswer,
  directRecipeAnswer,
  tryDirectAnswer,
};
