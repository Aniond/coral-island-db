const pool = require('../db');

const SOURCE_INDEX_TTL_MS = 5 * 60 * 1000;
let cachedSourceIndex = null;
let cachedSourceIndexTime = 0;

const RAW_MATERIAL_SOURCES = {
  wood: 'Raw material: chop trees, logs, and branches with an axe.',
  hardwood: 'Raw material: chop hardwood logs/stumps after upgrading your axe.',
  stone: 'Raw material: break rocks on the farm, around the island, or in the mines.',
  scrap: 'Raw material: clear trash piles, recycle trash, and scavenge around the island/ocean.',
  trash: 'Raw material: found while fishing, diving, or clearing trash piles.',
  compost: 'Farming material: make from trash/organic material or buy/use composting systems.',
  sap: 'Raw material: drops from chopping trees.',
  fiber: 'Raw material: cut weeds/grass with the scythe.',
  seaweed: 'Diving material: gather while diving in ocean areas.',
  bronze_kelp: 'Diving material: gather bronze kelp in early ocean zones.',
  silver_kelp: 'Diving material: gather silver kelp in deeper ocean zones.',
  gold_kelp: 'Diving material: gather gold kelp in deeper ocean zones.',
  osmium_kelp: 'Diving material: gather osmium kelp in late ocean zones.',
  bronze_kelp_essence: 'Lab/ocean material: process bronze kelp into essence.',
  silver_kelp_essence: 'Lab/ocean material: process silver kelp into essence.',
  gold_kelp_essence: 'Lab/ocean material: process gold kelp into essence.',
  osmium_kelp_essence: 'Lab/ocean material: process osmium kelp into essence.',
  bronze_bar: 'Smelt from Bronze Ore and Coal; Bronze Ore is found in the Earth Mine.',
  silver_bar: 'Smelt from Silver Ore and Coal; Silver Ore is found in the Water Mine.',
  gold_bar: 'Smelt from Gold Ore and Coal; Gold Ore is found in the Wind Mine.',
  osmium_bar: 'Smelt from Osmium Ore and Coal; Osmium Ore is found in the Fire Mine.',
  glass: 'Crafted/smelting material made from sand.',
  coal: 'Mine material: found in caves and used for smelting.',
  sand: 'Beach/diving material: gather from sandy areas.',
  slime_goop: 'Monster drop: defeat slimes in the mines and Cave of Memories.',
  battery: 'Machine material: produced by solar panels or bought/found from late-game sources.',
  hay: 'Ranch material: cut grass after building a silo or buy from the ranch.',
  wind_essence: 'Monster/cave material: drops from wind-themed monsters in the mines.',
  water_essence: 'Monster/cave material: drops from water-themed monsters in the mines.',
  earth_essence: 'Monster/cave material: drops from earth-themed monsters in the mines.',
  fire_essence: 'Monster/cave material: drops from fire-themed monsters in the mines.',
  flame_essence: 'Monster/cave material: drops from fire-themed monsters in the mines.',
  dark_essence: 'Monster/cave material: drops from shadow/dark monsters in later mines.',
  monster_essence: 'Monster drop: defeat monsters in the mines.',
  cursed_fragment: 'Monster/cave material: found from tougher monsters and late cave content.',
  tough_meat: 'Monster drop: defeat animal-like monsters in the mines.',
  silky_fur: 'Monster drop: defeat furry monsters in the mines.',
  bat_wing: 'Monster drop: defeat bats in the mines.',
  bone: 'Cave/diving material: found from fossils, bones, and monster/cave sources.',
  solar_fragment: 'Late-game material: collect from solar-themed resources/events.',
  morel: 'Forageable mushroom: found in forest/cave mushroom areas.',
  ginger: 'Forageable/spice crop material: gather or buy when available.',
  sugar: 'Cooking ingredient: buy from Sam\'s General Store or use cooking pantry sources.',
  flour: 'Cooking ingredient: buy from Sam\'s General Store or process wheat.',
  rice: 'Cooking ingredient: grow rice or buy from Sam\'s General Store.',
  oil: 'Cooking ingredient: buy from Sam\'s General Store or make with artisan processing.',
  salt: 'Cooking ingredient: buy from Sam\'s General Store.',
  pepper: 'Cooking ingredient: buy from Sam\'s General Store.',
  wasabi: 'Forageable/spice ingredient: gather in season or buy when available.',
  apple: 'Fruit tree/plant harvest: grow from fruit seedlings in the matching season.',
  banana: 'Fruit tree/plant harvest: grow from fruit seedlings in the matching season.',
  almond: 'Fruit tree/plant harvest: grow from fruit seedlings in the matching season.',
  cocoa_bean: 'Fruit tree/plant harvest: grow from fruit seedlings in the matching season.',
  avocado: 'Fruit tree/plant harvest: grow from fruit seedlings in the matching season.',
  jackfruit: 'Fruit tree/plant harvest: grow from fruit seedlings in the matching season.',
  lemon: 'Fruit tree/plant harvest: grow from fruit seedlings in the matching season.',
  olive: 'Fruit tree/plant harvest: grow from fruit seedlings in the matching season.',
  dragonfruit: 'Fruit tree/plant harvest: grow from fruit seedlings in the matching season.',
  durian: 'Fruit tree/plant harvest: grow from fruit seedlings in the matching season.',
  mango: 'Fruit tree/plant harvest: grow from fruit seedlings in the matching season.',
  rambutan: 'Fruit tree/plant harvest: grow from fruit seedlings in the matching season.',
  lychee: 'Fruit tree/plant harvest: grow from fruit seedlings in the matching season.',
  maple_seeds: 'Tree seed: gather from maple trees while shaking/chopping trees.',
  oak_seeds: 'Tree seed: gather from oak trees while shaking/chopping trees.',
  pine_cone: 'Tree seed: gather from pine trees while shaking/chopping trees.',
  black_trumpet: 'Forageable mushroom: gather in the matching season and forest/cave areas.',
  hoarder_ring: 'Equipment loot: found from combat/loot sources in the mines.',
  plop_backpack: 'Equipment loot: found from combat/loot sources in the mines.',
  axe: 'Starter tool: included in the base tool set and upgraded at the blacksmith.',
  hoe: 'Starter tool: included in the base tool set and upgraded at the blacksmith.',
  pickaxe: 'Starter tool: included in the base tool set and upgraded at the blacksmith.',
  scythe: 'Starter tool: included in the base tool set and upgraded at the blacksmith.',
  watering_can: 'Starter tool: included in the base tool set and upgraded at the blacksmith.',
};

function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/^\s*\d+\s*x?\s+/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function keyFor(value) {
  return normalizeName(value).replace(/\s+/g, '_');
}

function singularKey(value) {
  const key = keyFor(value);
  if (key.endsWith('ies')) return `${key.slice(0, -3)}y`;
  if (key.endsWith('s') && !key.endsWith('ss')) return key.slice(0, -1);
  return key;
}

function parseItemList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') return [value];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isGenericReference(name) {
  const normalized = normalizeName(name);
  return (
    normalized.startsWith('any ') ||
    normalized.startsWith('all ') ||
    normalized.startsWith('random ') ||
    normalized.includes(' of any ')
  );
}

function genericSourceDescription(name) {
  const normalized = normalizeName(name);
  if (normalized.includes('fish')) return 'Any fish: catch with a fishing pole; use the fish list for season, time, and location.';
  if (normalized.includes('insect') || normalized.includes('bug')) return 'Any insect/bug: catch with the bug net; use the insect list for season, time, and location.';
  if (normalized.includes('critter')) return 'Any sea critter: catch while diving; use the sea critter list for location details.';
  if (normalized.includes('flower')) return 'Any flower: grow flower crops or gather seasonal flowers where available.';
  if (normalized.includes('fruit')) return 'Any fruit: harvest fruit crops, fruit plants, or fruit trees.';
  if (normalized.includes('vegetable') || normalized.includes('veggie')) return 'Any vegetable: grow vegetable crops in their matching season.';
  if (normalized.includes('mushroom')) return 'Any mushroom: forage in forest/cave areas or use mushroom-producing sources.';
  if (normalized.includes('egg')) return 'Any egg: collect from coop animals.';
  if (normalized.includes('milk')) return 'Any milk: collect from barn animals.';
  if (normalized.includes('ore')) return 'Any ore: mine ore nodes in the Earth, Water, Wind, or Fire mines.';
  if (normalized.includes('honey')) return 'Any honey: place flowers near bee houses and process with artisan equipment.';
  if (normalized.includes('scavengeable')) return 'Any scavengeable: gather matching forage/scavenge items from land, beach, or ocean zones.';
  if (normalized.includes('tree seed')) return 'Any tree seed: shake/chop trees or gather seeds while clearing the farm.';
  return `${name}: generic recipe category; choose any matching item from the database.`;
}

function addSource(index, name, source) {
  const keys = new Set([keyFor(name), singularKey(name)]);
  for (const key of keys) {
    if (!key) continue;
    if (!index.has(key)) index.set(key, []);
    index.get(key).push({ ...source, name });
  }
}

async function buildItemSourceIndex() {
  if (cachedSourceIndex && Date.now() - cachedSourceIndexTime < SOURCE_INDEX_TTL_MS) {
    return cachedSourceIndex;
  }

  const index = new Map();
  const q = async (sql) => {
    try {
      const { rows } = await pool.query(sql);
      return rows;
    } catch (err) {
      console.error('buildItemSourceIndex query failed:', err.message);
      return [];
    }
  };

  const [crops, caves, forageables, collectibles, animals, artisan, crafting, cooking, tools] = await Promise.all([
    q('SELECT name, type, season, town_rank, grow_days, seed_price, sell_price, regrowth_days FROM crops ORDER BY name'),
    q('SELECT item_name AS name, item_type, cave, floor_range, notes FROM cave_items ORDER BY item_name'),
    q('SELECT name, season, location, area, sell_price, notes FROM forageables ORDER BY name'),
    q('SELECT name, category, seasons, locations, time_of_day, rarity, sell_price FROM collectibles ORDER BY name'),
    q('SELECT name, sell_price, description FROM animal_products ORDER BY name'),
    q('SELECT name, sell_price, description FROM artisan_products ORDER BY name'),
    q('SELECT name, output_amount, category, mastery_type, mastery_level, ingredients FROM crafting_recipes ORDER BY name'),
    q('SELECT name, utensil, ingredients, buff, health, energy FROM cooking_recipes ORDER BY name'),
    q('SELECT name, tool_type, tier, price, days_delay, requirements FROM tools ORDER BY name'),
  ]);

  for (const row of crops) addSource(index, row.name, { type: 'Crop', row });
  for (const row of caves) addSource(index, row.name, { type: 'Cave Item', row });
  for (const row of forageables) addSource(index, row.name, { type: 'Forageable', row });
  for (const row of collectibles) addSource(index, row.name, { type: 'Collectible', row });
  for (const row of animals) addSource(index, row.name, { type: 'Animal Product', row });
  for (const row of artisan) addSource(index, row.name, { type: 'Artisan Product', row });
  for (const row of crafting) addSource(index, row.name, { type: 'Crafting Recipe', row });
  for (const row of cooking) addSource(index, row.name, { type: 'Cooking Recipe', row });
  for (const row of tools) addSource(index, row.name, { type: 'Tool', row });

  for (const [key, description] of Object.entries(RAW_MATERIAL_SOURCES)) {
    addSource(index, key.replace(/_/g, ' '), { type: 'Raw Material', row: { description } });
  }

  cachedSourceIndex = index;
  cachedSourceIndexTime = Date.now();
  return cachedSourceIndex;
}

function findItemSources(name, index) {
  if (!name || !index) return [];
  const keys = [keyFor(name), singularKey(name)];
  const seen = new Set();
  const sources = [];
  for (const key of keys) {
    for (const source of index.get(key) || []) {
      const sourceKey = `${source.type}:${source.name}`;
      if (seen.has(sourceKey)) continue;
      seen.add(sourceKey);
      sources.push(source);
    }
  }
  return sources;
}

function describeSource(source) {
  const row = source.row || {};
  switch (source.type) {
    case 'Crop':
      return `Crop: ${row.season || 'season unknown'}, rank ${row.town_rank || '-'}, ${row.grow_days || '-'}d grow${row.regrowth_days ? `, regrows ${row.regrowth_days}d` : ''}`;
    case 'Cave Item':
      return `${row.item_type || 'Cave item'}: ${row.cave || 'unknown'} mine, floors ${row.floor_range || '-'}`;
    case 'Forageable':
      return `Forageable: ${row.season || 'season unknown'} at ${row.location || '-'}${row.area ? ` (${row.area})` : ''}`;
    case 'Collectible':
      return `${row.category || 'Collectible'}: ${row.seasons || 'any season'} at ${row.locations || '-'}${row.time_of_day ? `, ${row.time_of_day}` : ''}`;
    case 'Animal Product':
      return `Animal product: ${row.description || 'from ranch animals'}`;
    case 'Artisan Product':
      return `Artisan product: ${row.description || 'made in artisan equipment'}`;
    case 'Crafting Recipe':
      return `Crafting recipe: ${formatAmount(row.output_amount || 1)} output${row.mastery_type ? `, unlock ${row.mastery_type} lvl ${row.mastery_level || '-'}` : ''}`;
    case 'Cooking Recipe':
      return `Cooking recipe: ${row.utensil || 'utensil unknown'}${row.buff ? `, buff ${row.buff}` : ''}`;
    case 'Tool':
      return `Tool: ${row.tool_type || 'tool'} ${row.tier || ''}, costs ${row.price || 0}g`.trim();
    case 'Raw Material':
      return row.description;
    default:
      return `${source.type}: ${source.name}`;
  }
}

function formatAmount(amount) {
  const n = Number(amount);
  return Number.isFinite(n) && n > 0 ? String(n) : '1';
}

function describeItemSources(name, index, { max = 3 } = {}) {
  if (isGenericReference(name)) return genericSourceDescription(name);
  const sources = findItemSources(name, index);
  if (!sources.length) return 'No linked source found yet.';
  return sources.slice(0, max).map(describeSource).join('; ');
}

function renderItemSourceList(items, index, { maxSources = 2 } = {}) {
  return parseItemList(items)
    .map(item => {
      const name = item.name || item.item_name || String(item);
      return `${formatAmount(item.amount)}x ${name} - ${describeItemSources(name, index, { max: maxSources })}`;
    })
    .join('; ');
}

module.exports = {
  buildItemSourceIndex,
  describeItemSources,
  findItemSources,
  genericSourceDescription,
  isGenericReference,
  normalizeName,
  parseItemList,
  renderItemSourceList,
};
