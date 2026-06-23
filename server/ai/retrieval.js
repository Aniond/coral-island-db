const pool = require('../db');
const {
  AI_CONTEXT_TTL_MS,
  MAX_CONTEXT_CHARS,
  RETRIEVAL_LIMIT,
} = require('./config');
const {
  extractTerms,
  hasAny,
  normalizeText,
  scoreLine,
} = require('./text');

let cachedAISections = null;
let cachedAISectionsTime = 0;

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

function parseIngredients(v) {
  if (Array.isArray(v)) return v;
  try { return JSON.parse(v) || []; } catch { return []; }
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
    `- ${c.item_name} (${c.item_type}) - ${c.cave} mine, floors ${c.floor_range}` +
    `${c.notes ? `. ${c.notes}` : ''}`);

  const forageLines = forageables.rows.map(f =>
    `- ${f.name} (${f.season}) - ${f.location} [${f.area}]` +
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

  const craftingLines = crafting.rows.map(r => {
    const ingredients = parseIngredients(r.ingredients);
    const ingStr = ingredients.map(i => `${i.amount}x ${i.name}`).join(', ') || 'unknown';
    let line = `- ${r.name}${r.output_amount > 1 ? ` (makes ${r.output_amount})` : ''} [${r.category}]`;
    if (r.mastery_type) line += ` - unlocks at ${r.mastery_type} mastery lvl ${r.mastery_level}`;
    line += `. Ingredients: ${ingStr}`;
    return line;
  });

  const cookingLines = cooking.rows.map(r => {
    const ingredients = parseIngredients(r.ingredients);
    const ingStr = ingredients.map(i => `${i.amount}x ${i.name}`).join(', ') || 'unknown';
    let line = `- ${r.name} [cooked in ${r.utensil}]`;
    if (r.buff) line += ` - buff: ${r.buff}${r.buff_duration_min ? ` (~${r.buff_duration_min}m)` : ''}`;
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
    try { reqs = JSON.parse(t.requirements); } catch {}
    const reqStr = reqs.map(r => `${r.amount}x ${r.name}`).join(', ');
    return `- ${t.name} (${t.tool_type}, ${t.tier}): Costs ${t.price}g and takes ${t.days_delay} days. Requires: ${reqStr}`;
  });

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
    throw new Error('database context is empty - DB is unreachable or unseeded');
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
      try { items = JSON.parse(items); } catch { items = []; }
    }
    if (Array.isArray(items) && items.length > 0) {
      return `\n[COMPLETED OFFERINGS: ${items.join(', ')}]\n`;
    }
  } catch {}
  return '';
}

module.exports = {
  buildContextSections,
  buildRelevantContext,
  classifySections,
  getDonatedString,
  retrieveContextDocs,
};
