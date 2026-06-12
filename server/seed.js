/**
 * Seeds the Coral Island database.
 *
 * Applies schema.sql (drops + recreates the four tables) then inserts all data
 * inside a single transaction. Idempotent: re-running starts from a clean slate.
 *
 * Usage:  node seed.js   (or: npm run seed)
 * Requires DATABASE_URL in .env to point at a reachable PostgreSQL instance.
 */

const fs = require('fs');
const path = require('path');
const pool = require('./db');

// ---- CROPS -----------------------------------------------------------------
// Full crop and seed list automatically pulled from coral.guide database.
// Includes base prices, automatically calculated qualities (Bronze, Silver,
// Gold, Osmium), and descriptions of planting rules for fruit trees/plants.
// Regenerate with scripts/build-crops.js.
const crops = require('./data/crops.json');

// ---- CAVE ITEMS ------------------------------------------------------------
const caveItems = [
  // Earth Mine (first mine, available from Day 7)
  { cave: 'earth', item_name: 'Bronze Ore',  item_type: 'ore',          floor_range: 'all floors', notes: 'Most common ore. Used for tool upgrades and crafting.' },
  { cave: 'earth', item_name: 'Coal',        item_type: 'ore',          floor_range: 'all floors', notes: 'Required for smelting. 5 ore + coal = 1 bar.' },
  { cave: 'earth', item_name: 'Earth Geode', item_type: 'geode',        floor_range: 'all floors', notes: 'Break open at blacksmith for gems or minerals.' },
  { cave: 'earth', item_name: 'Copper Gem',  item_type: 'gem',          floor_range: '1-20',       notes: null },
  { cave: 'earth', item_name: 'Topaz',       item_type: 'gem',          floor_range: '20-40',      notes: null },
  { cave: 'earth', item_name: 'Slime Disc',  item_type: 'monster_drop', floor_range: 'all floors', notes: 'Dropped by Slime enemies. ~40 HP damage if hit.' },
  { cave: 'earth', item_name: 'Spider Fang', item_type: 'monster_drop', floor_range: 'all floors', notes: 'Dropped by Spider enemies. ~50 HP damage if hit.' },
  { cave: 'earth', item_name: 'Stone',       item_type: 'scavengeable', floor_range: 'all floors', notes: 'Abundant. Used in many crafting recipes.' },
  { cave: 'earth', item_name: 'Coffer',      item_type: 'scavengeable', floor_range: 'all floors', notes: 'Small treasure containers found on floors.' },

  // Water Mine (unlock by reaching Earth Mine floor 40)
  { cave: 'water', item_name: 'Silver Ore',     item_type: 'ore',   floor_range: 'all floors',   notes: 'Used for mid-tier tool upgrades and crafting.' },
  { cave: 'water', item_name: 'Bronze Ore',     item_type: 'ore',   floor_range: 'all floors',   notes: null },
  { cave: 'water', item_name: 'Water Geode',    item_type: 'geode', floor_range: 'all floors',   notes: null },
  { cave: 'water', item_name: 'Aquamarine',     item_type: 'gem',   floor_range: 'all floors',   notes: null },
  { cave: 'water', item_name: 'Sapphire',       item_type: 'gem',   floor_range: '20-40',        notes: 'Rarer gem found in deeper floors.' },
  { cave: 'water', item_name: 'Blue Tang',      item_type: 'fish',  floor_range: 'water pockets', notes: 'Can be caught in water pockets on mine floors.' },
  { cave: 'water', item_name: 'Silver Arowana', item_type: 'fish',  floor_range: 'water pockets', notes: 'Rare. Time-sensitive catch window.' },
  { cave: 'water', item_name: 'Tilapia',        item_type: 'fish',  floor_range: 'water pockets', notes: null },

  // Wind Mine (unlock by reaching Water Mine floor 40)
  { cave: 'wind', item_name: 'Gold Ore',   item_type: 'ore',   floor_range: 'all floors', notes: 'High-tier ore. Used for advanced upgrades.' },
  { cave: 'wind', item_name: 'Silver Ore',  item_type: 'ore',   floor_range: 'all floors', notes: null },
  { cave: 'wind', item_name: 'Wind Geode',  item_type: 'geode', floor_range: 'all floors', notes: null },
  { cave: 'wind', item_name: 'Emerald',     item_type: 'gem',   floor_range: 'all floors', notes: null },
  { cave: 'wind', item_name: 'Diamond',     item_type: 'gem',   floor_range: '30-40',      notes: 'Rarest gem in Wind Mine. Deep floors only.' },

  // Fire Mine (unlock by reaching Wind Mine floor 40)
  { cave: 'fire', item_name: 'Osmium Ore', item_type: 'ore',   floor_range: 'all floors', notes: 'Rarest ore. End-game crafting material.' },
  { cave: 'fire', item_name: 'Gold Ore',   item_type: 'ore',   floor_range: 'all floors', notes: null },
  { cave: 'fire', item_name: 'Fire Geode', item_type: 'geode', floor_range: 'all floors', notes: null },
  { cave: 'fire', item_name: 'Ruby',       item_type: 'gem',   floor_range: 'all floors', notes: null },
  { cave: 'fire', item_name: 'Fire Opal',  item_type: 'gem',   floor_range: '20-40',      notes: 'Valuable gem found in deeper fire mine floors.' },

  // Cave of Memories (unlock after all Lake Temple advanced altar offerings)
  { cave: 'memories', item_name: 'Mixed Ores',      item_type: 'ore',          floor_range: 'all floors', notes: 'All ore types can be found here.' },
  { cave: 'memories', item_name: 'Fossil Node',     item_type: 'scavengeable', floor_range: 'all floors', notes: 'Break for fossil items. Donate to museum.' },
  { cave: 'memories', item_name: 'Coffer',          item_type: 'scavengeable', floor_range: 'all floors', notes: null },
  { cave: 'memories', item_name: 'Dino Print',      item_type: 'scavengeable', floor_range: 'all floors', notes: 'Needed for museum hologram quest.' },
  { cave: 'memories', item_name: 'Wellness Fruit',  item_type: 'scavengeable', floor_range: 'floor 25',   notes: 'Found in checkpoint chest at floor 25.' },
  { cave: 'memories', item_name: 'Yellow Mushroom', item_type: 'scavengeable', floor_range: '1-25',       notes: 'First section has mushroom theme floors.' }
];

// ---- FORAGEABLES -----------------------------------------------------------
// Full foraging/gathering list (85 items: seasonal land forage, beach, diving,
// truffles, mushrooms) with seasons, prices, descriptions, and icons.
// Regenerate with scripts/build-forageables.js.
const forageables = require('./data/forageables.json');

// ---- COLLECTIBLES ----------------------------------------------------------
// Full museum/journal audit: fish, insects, sea critters, fossils, artifacts,
// gems (345 items) with prices, rarity, seasons/locations, descriptions, icons.
// Regenerate with scripts/build-collectibles.js.
const collectibles = require('./data/collectibles.json');

// ---- CRAFTING RECIPES ------------------------------------------------------
// Full crafting recipe list (158) with structured ingredients, categories,
// mastery unlocks, descriptions, and output icons. Ingredients are stored as a
// JSON string. Regenerate with scripts/build-crafting.js.
const crafting = require('./data/crafting-recipes.json').map(r => ({
  ...r,
  ingredients: JSON.stringify(r.ingredients),
}));

// ---- COOKING RECIPES -------------------------------------------------------
// Full cooking recipe list (106) with food buffs (skill/stat bonuses), utensil,
// HP/energy restore, ingredients, and icons. Regenerate with build-cooking.js.
const cooking = require('./data/cooking-recipes.json').map(r => ({
  ...r,
  ingredients: JSON.stringify(r.ingredients),
}));

// ---- NPCS ------------------------------------------------------------------
// Full giftable roster (71 NPCs) with accurate loved/liked gifts, birthdays,
// bios, and portrait art. Data mined from the game via the open-source
// coral-island-guide project (github.com/koenigderluegner/coral-island-guide).
// Regenerate with scripts/build-npcs.js if the game updates.
const npcs = require('./data/npcs.json');

// ---- GODDESS OFFERINGS -----------------------------------------------------
// Full listing of all altars and bundles from the Lake Temple.
// Regenerate with scripts/build-offerings.js.
const goddessOfferings = require('./data/goddess-offerings.json');

// ---- ANIMAL PRODUCTS -------------------------------------------------------
// Full listing of items from ranch animals (milk, eggs, wool, etc).
// Regenerate with scripts/build-animals.js.
const animalProducts = require('./data/animal-products.json');

// ---- ARTISAN PRODUCTS ------------------------------------------------------
// Full listing of processed artisan goods (cheese, mayonnaise, pickled items).
// Regenerate with scripts/build-artisan.js.
const artisanProducts = require('./data/artisan-products.json');

/**
 * Inserts an array of row objects into `table` using a single multi-row
 * parameterized INSERT. `columns` defines both the column list and the order
 * in which each row's values are read.
 */
async function insertRows(client, table, columns, rows) {
  if (rows.length === 0) return;
  const colCount = columns.length;
  const valuesSql = rows
    .map((_, r) => '(' + columns.map((_, c) => `$${r * colCount + c + 1}`).join(', ') + ')')
    .join(', ');
  const params = rows.flatMap((row) => columns.map((col) => (row[col] === undefined ? null : row[col])));
  await client.query(`INSERT INTO ${table} (${columns.join(', ')}) VALUES ${valuesSql}`, params);
}

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error("Destructive seed script blocked in production environment!");
  }

  const goddessOfferingsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/goddess-offerings.json'), 'utf-8'));
  const animalProductsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/animal-products.json'), 'utf-8'));
  const artisanProductsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/artisan-products.json'), 'utf-8'));
  const toolsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/tools.json'), 'utf-8'));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);

    await insertRows(client, 'crops',
      ['name', 'type', 'season', 'town_rank', 'grow_days', 'seed_price', 'sell_price', 'price_bronze', 'price_silver', 'price_gold', 'price_osmium', 'regrowth_days', 'notes'], crops);
    await insertRows(client, 'cave_items',
      ['cave', 'item_name', 'item_type', 'floor_range', 'notes'], caveItems);
    await insertRows(client, 'forageables',
      ['name', 'season', 'location', 'area', 'notes', 'sell_price', 'image_url'], forageables);
    await insertRows(client, 'collectibles',
      ['category', 'name', 'sell_price', 'rarity', 'seasons', 'locations', 'time_of_day', 'description', 'icon', 'sort_order'], collectibles);
    await insertRows(client, 'crafting_recipes',
      ['name', 'output_amount', 'category', 'mastery_type', 'mastery_level', 'ingredients', 'description', 'image_url'], crafting);
    await insertRows(client, 'cooking_recipes',
      ['name', 'utensil', 'ingredients', 'buff', 'buff_duration_min', 'health', 'energy', 'sell_price', 'description', 'image_url'], cooking);
    await insertRows(client, 'npcs',
      ['name', 'role', 'location', 'schedule', 'loved_gifts', 'liked_gifts', 'quest_summary', 'birthday', 'image_url'], npcs);
    await insertRows(client, 'goddess_offerings',
      ['altar_name', 'bundle_name', 'item_name', 'amount', 'quality'], goddessOfferingsData);
    await insertRows(client, 'animal_products',
      ['name', 'sell_price', 'description', 'image_url'], animalProductsData);
    await insertRows(client, 'artisan_products',
      ['name', 'sell_price', 'description', 'image_url'], artisanProductsData);
    await insertRows(client, 'tools',
      ['name', 'tool_type', 'tier', 'price', 'days_delay', 'requirements'], toolsData.map(t => ({...t, requirements: JSON.stringify(t.requirements)})));

    await client.query('COMMIT');

    console.log('Coral Island database seeded successfully:');
    console.log(`  crops:       ${crops.length}`);
    console.log(`  cave_items:  ${caveItems.length}`);
    console.log(`  forageables: ${forageables.length}`);
    console.log(`  collectibles:${collectibles.length}`);
    console.log(`  crafting:    ${crafting.length}`);
    console.log(`  cooking:     ${cooking.length}`);
    console.log(`  npcs:        ${npcs.length}`);
    console.log(`  offerings:   ${goddessOfferingsData.length}`);
    console.log(`  animals:     ${animalProductsData.length}`);
    console.log(`  artisan:     ${artisanProductsData.length}`);
    console.log(`  tools:       ${toolsData.length}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

seed()
  .then(() => pool.end())
  .catch((err) => {
    console.error('Seeding failed:', err.message);
    pool.end();
    process.exit(1);
  });
