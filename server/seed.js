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
// Structural notes reused for entries the source data didn't annotate individually.
const FRUIT_PLANT_NOTE = '2x2 space needed. Needs watering. Dies off-season.';
const FRUIT_TREE_NOTE = '3x3 clear space needed. No watering. Dormant off-season.';
const OCEAN_NOTE = 'Underwater farm. Requires completing One of Us quest and reaching Town Rank A.';

const crops = [
  // Seeds
  { name: 'Turnip',      type: 'seed', season: 'spring',      town_rank: 'F', grow_days: 5,  sell_price: 40,  regrowth_days: null, notes: null },
  { name: 'Carrot',      type: 'seed', season: 'spring',      town_rank: 'F', grow_days: 5,  sell_price: 45,  regrowth_days: null, notes: null },
  { name: 'Parsnip',     type: 'seed', season: 'spring',      town_rank: 'F', grow_days: 4,  sell_price: 35,  regrowth_days: null, notes: null },
  { name: 'Potato',      type: 'seed', season: 'spring',      town_rank: 'F', grow_days: 6,  sell_price: 80,  regrowth_days: null, notes: null },
  { name: 'Cauliflower', type: 'seed', season: 'spring',      town_rank: 'F', grow_days: 12, sell_price: 175, regrowth_days: null, notes: null },
  { name: 'Daisy',       type: 'seed', season: 'spring',      town_rank: 'F', grow_days: 4,  sell_price: 40,  regrowth_days: null, notes: null },
  { name: 'Strawberry',  type: 'seed', season: 'spring',      town_rank: 'E', grow_days: 8,  sell_price: 120, regrowth_days: 4,    notes: null },
  { name: 'Tomato',      type: 'seed', season: 'summer',      town_rank: 'F', grow_days: 11, sell_price: 60,  regrowth_days: 4,    notes: null },
  { name: 'Blueberry',   type: 'seed', season: 'summer',      town_rank: 'F', grow_days: 13, sell_price: 50,  regrowth_days: 4,    notes: null },
  { name: 'Corn',        type: 'seed', season: 'summer/fall', town_rank: 'F', grow_days: 14, sell_price: 50,  regrowth_days: 4,    notes: null },
  { name: 'Sunflower',   type: 'seed', season: 'summer',      town_rank: 'F', grow_days: 8,  sell_price: 80,  regrowth_days: null, notes: null },
  { name: 'Radish',      type: 'seed', season: 'summer',      town_rank: 'D', grow_days: 6,  sell_price: 90,  regrowth_days: null, notes: null },
  { name: 'Melon',       type: 'seed', season: 'summer',      town_rank: 'D', grow_days: 12, sell_price: 250, regrowth_days: null, notes: null },
  { name: 'Pumpkin',     type: 'seed', season: 'fall',        town_rank: 'F', grow_days: 13, sell_price: 320, regrowth_days: null, notes: null },
  { name: 'Yam',         type: 'seed', season: 'fall',        town_rank: 'F', grow_days: 10, sell_price: 160, regrowth_days: null, notes: null },
  { name: 'Amaranth',    type: 'seed', season: 'fall',        town_rank: 'D', grow_days: 7,  sell_price: 150, regrowth_days: null, notes: null },
  { name: 'Bok Choy',    type: 'seed', season: 'fall',        town_rank: 'C', grow_days: 4,  sell_price: 80,  regrowth_days: null, notes: null },
  { name: 'Eggplant',    type: 'seed', season: 'fall',        town_rank: 'C', grow_days: 5,  sell_price: 60,  regrowth_days: 5,    notes: null },
  { name: 'Grape',       type: 'seed', season: 'fall',        town_rank: 'C', grow_days: 10, sell_price: 80,  regrowth_days: 3,    notes: null },

  // Fruit plants (2x2, need watering, die off-season)
  { name: 'Plum',        type: 'fruit_plant', season: 'winter/spring',  town_rank: 'E', grow_days: null, sell_price: 80,  regrowth_days: null, notes: '2x2 space needed. Dies off-season.' },
  { name: 'Banana',      type: 'fruit_plant', season: 'spring/summer',  town_rank: 'E', grow_days: null, sell_price: 150, regrowth_days: null, notes: '2x2 space needed. Dies off-season.' },
  { name: 'Rambutan',    type: 'fruit_plant', season: 'spring/summer',  town_rank: 'E', grow_days: null, sell_price: 120, regrowth_days: null, notes: FRUIT_PLANT_NOTE },
  { name: 'Jackfruit',   type: 'fruit_plant', season: 'summer/fall',    town_rank: 'E', grow_days: null, sell_price: 200, regrowth_days: null, notes: FRUIT_PLANT_NOTE },
  { name: 'Dragonfruit', type: 'fruit_plant', season: 'summer/fall',    town_rank: 'E', grow_days: null, sell_price: 400, regrowth_days: null, notes: 'Highest value fruit plant.' },
  { name: 'Papaya',      type: 'fruit_plant', season: 'summer/fall',    town_rank: 'E', grow_days: null, sell_price: 140, regrowth_days: null, notes: FRUIT_PLANT_NOTE },
  { name: 'Avocado',     type: 'fruit_plant', season: 'winter/spring',  town_rank: 'C', grow_days: null, sell_price: 200, regrowth_days: null, notes: FRUIT_PLANT_NOTE },
  { name: 'Cocoa',       type: 'fruit_plant', season: 'fall/winter',    town_rank: 'C', grow_days: null, sell_price: 270, regrowth_days: null, notes: FRUIT_PLANT_NOTE },
  { name: 'Lemon',       type: 'fruit_plant', season: 'fall/winter',    town_rank: 'C', grow_days: null, sell_price: 150, regrowth_days: null, notes: FRUIT_PLANT_NOTE },
  { name: 'Pear',        type: 'fruit_plant', season: 'fall/winter',    town_rank: 'C', grow_days: null, sell_price: 140, regrowth_days: null, notes: FRUIT_PLANT_NOTE },
  { name: 'Lychee',      type: 'fruit_plant', season: 'winter/spring',  town_rank: 'C', grow_days: null, sell_price: 180, regrowth_days: null, notes: FRUIT_PLANT_NOTE },
  { name: 'Snakefruit',  type: 'fruit_plant', season: 'winter/spring',  town_rank: 'C', grow_days: null, sell_price: 250, regrowth_days: null, notes: FRUIT_PLANT_NOTE },

  // Fruit trees (3x3 untilled, no watering, dormant off-season, all rank C)
  { name: 'Durian', type: 'fruit_tree', season: 'spring', town_rank: 'C', grow_days: null, sell_price: 600, regrowth_days: null, notes: '3x3 clear space needed. No watering. Dormant off-season.' },
  { name: 'Orange', type: 'fruit_tree', season: 'spring', town_rank: 'C', grow_days: null, sell_price: 160, regrowth_days: null, notes: FRUIT_TREE_NOTE },
  { name: 'Mango',  type: 'fruit_tree', season: 'summer', town_rank: 'C', grow_days: null, sell_price: 130, regrowth_days: null, notes: FRUIT_TREE_NOTE },
  { name: 'Peach',  type: 'fruit_tree', season: 'summer', town_rank: 'C', grow_days: null, sell_price: 140, regrowth_days: null, notes: FRUIT_TREE_NOTE },
  { name: 'Apple',  type: 'fruit_tree', season: 'fall',   town_rank: 'C', grow_days: null, sell_price: 100, regrowth_days: null, notes: FRUIT_TREE_NOTE },
  { name: 'Olive',  type: 'fruit_tree', season: 'fall',   town_rank: 'C', grow_days: null, sell_price: 150, regrowth_days: null, notes: FRUIT_TREE_NOTE },
  { name: 'Almond', type: 'fruit_tree', season: 'winter', town_rank: 'C', grow_days: null, sell_price: 200, regrowth_days: null, notes: FRUIT_TREE_NOTE },

  // Ocean crops (unlock after One of Us quest + rank A)
  { name: 'Kelp',         type: 'ocean_crop', season: 'all', town_rank: 'A', grow_days: 4,  sell_price: 500,  regrowth_days: null, notes: OCEAN_NOTE },
  { name: 'Sea Grape',    type: 'ocean_crop', season: 'all', town_rank: 'A', grow_days: 6,  sell_price: 600,  regrowth_days: null, notes: OCEAN_NOTE },
  { name: 'Pearl Oyster', type: 'ocean_crop', season: 'all', town_rank: 'A', grow_days: 10, sell_price: 1200, regrowth_days: null, notes: 'Most valuable ocean crop.' }
];

// Automatically calculate seed costs and quality tiers for crops
crops.forEach(c => {
  // Hardcoded known seed costs
  if (c.name === 'Turnip') c.seed_price = 15;
  else if (c.name === 'Parsnip') c.seed_price = 15;
  else c.seed_price = Math.floor(c.sell_price * 0.4);

  // Quality price multipliers
  c.price_bronze = Math.floor(c.sell_price * 1.15);
  c.price_silver = Math.floor(c.sell_price * 1.30);
  c.price_gold   = Math.floor(c.sell_price * 1.50);
  c.price_osmium = Math.floor(c.sell_price * 2.00);
});

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
const goddessOfferings = [
  { altar_name: 'Crop Altar', bundle_name: 'Essential Resources', item_name: 'Wood', amount: 10, quality: 'Base' },
  { altar_name: 'Crop Altar', bundle_name: 'Essential Resources', item_name: 'Stone', amount: 10, quality: 'Base' },
  { altar_name: 'Crop Altar', bundle_name: 'Essential Resources', item_name: 'Fiber', amount: 10, quality: 'Base' },
  { altar_name: 'Crop Altar', bundle_name: 'Essential Resources', item_name: 'Sap', amount: 10, quality: 'Base' },
  { altar_name: 'Crop Altar', bundle_name: 'Essential Resources', item_name: 'Oak Resin', amount: 5, quality: 'Base' },
  { altar_name: 'Crop Altar', bundle_name: 'Essential Resources', item_name: 'Maple Syrup', amount: 5, quality: 'Base' },
  
  { altar_name: 'Crop Altar', bundle_name: 'Spring Sesajen', item_name: 'Turnip', amount: 1, quality: 'Bronze' },
  { altar_name: 'Crop Altar', bundle_name: 'Spring Sesajen', item_name: 'Carrot', amount: 1, quality: 'Bronze' },
  { altar_name: 'Crop Altar', bundle_name: 'Spring Sesajen', item_name: 'Daisy', amount: 1, quality: 'Bronze' },
  { altar_name: 'Crop Altar', bundle_name: 'Spring Sesajen', item_name: 'Wasabi', amount: 1, quality: 'Base' },
  { altar_name: 'Crop Altar', bundle_name: 'Spring Sesajen', item_name: 'Bamboo shoot', amount: 1, quality: 'Base' },

  { altar_name: 'Catch Altar', bundle_name: 'Fresh Water Fish', item_name: 'Tilapia', amount: 1, quality: 'Base' },
  { altar_name: 'Catch Altar', bundle_name: 'Fresh Water Fish', item_name: 'Catfish', amount: 1, quality: 'Base' },
  { altar_name: 'Catch Altar', bundle_name: 'Fresh Water Fish', item_name: 'Silver Arowana', amount: 1, quality: 'Base' }
];

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
      ['altar_name', 'bundle_name', 'item_name', 'amount', 'quality'], goddessOfferings);

    await client.query('COMMIT');

    console.log('Coral Island database seeded successfully:');
    console.log(`  crops:       ${crops.length}`);
    console.log(`  cave_items:  ${caveItems.length}`);
    console.log(`  forageables: ${forageables.length}`);
    console.log(`  collectibles:${collectibles.length}`);
    console.log(`  crafting:    ${crafting.length}`);
    console.log(`  cooking:     ${cooking.length}`);
    console.log(`  npcs:        ${npcs.length}`);
    console.log(`  offerings:   ${goddessOfferings.length}`);
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
