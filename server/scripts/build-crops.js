const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE = 'https://raw.githubusercontent.com/koenigderluegner/coral-island-guide/main/packages/guide/src/assets/live/database';
const ICON_BASE = 'https://coral.guide/assets/live/items/icons';

function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) { reject(new Error(`${res.statusCode} for ${url}`)); return; }
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

async function main() {
  const [items, cropsData, fruitPlants, fruitTrees, en] = await Promise.all([
    getJson(`${BASE}/items.json`),
    getJson(`${BASE}/crops.json`),
    getJson(`${BASE}/fruit-plants.json`),
    getJson(`${BASE}/fruit-trees.json`),
    getJson(`${BASE}/i18n/en.json`),
  ]);

  const cropsMap = new Map();

  const mapTownRank = (tags, defaultRank) => {
    if (!tags) return defaultRank;
    const t = tags.find(tag => tag.startsWith('item.townrank.'));
    if (!t) return defaultRank;
    const level = parseInt(t.replace('item.townrank.', ''), 10);
    const ranks = ['F', 'E', 'D', 'C', 'B', 'A'];
    return ranks[level] || defaultRank;
  };

  // Parse regular crops
  cropsData.forEach(c => {
    if (!c.item || !c.pickupableItem) return;
    const seedItem = items.find(i => i.id === c.item.id);
    const cropItem = items.find(i => i.id === c.pickupableItem.id);
    if (!seedItem || !cropItem) return;

    cropsMap.set(c.pickupableItem.id, {
      name: en[cropItem.displayName] || cropItem.displayName,
      type: 'seed',
      season: (c.growableSeason || []).join('/'),
      town_rank: mapTownRank(cropItem.tags, 'F'),
      grow_days: c.growTime,
      seed_price: seedItem.price || Math.floor((cropItem.sellPrice || 0) * 0.4),
      sell_price: cropItem.sellPrice,
      regrowth_days: c.isRegrowable ? c.regrowableLength : null,
      notes: null
    });
  });

  // Parse fruit plants
  fruitPlants.forEach(c => {
    if (!c.item || !c.pickupableItem) return;
    const seedItem = items.find(i => i.id === c.item.id);
    const cropItem = items.find(i => i.id === c.pickupableItem.id);
    if (!seedItem || !cropItem) return;

    cropsMap.set(c.pickupableItem.id, {
      name: en[cropItem.displayName] || cropItem.displayName,
      type: 'fruit_plant',
      season: (c.growableSeason || []).join('/'),
      town_rank: mapTownRank(cropItem.tags, 'E'),
      grow_days: null,
      seed_price: seedItem.price || Math.floor((cropItem.sellPrice || 0) * 0.4),
      sell_price: cropItem.sellPrice,
      regrowth_days: null,
      notes: '2x2 space needed. Needs watering. Dies off-season.'
    });
  });

  // Parse fruit trees
  fruitTrees.forEach(c => {
    if (!c.item || !c.pickupableItem) return;
    const seedItem = items.find(i => i.id === c.item.id);
    const cropItem = items.find(i => i.id === c.pickupableItem.id);
    if (!seedItem || !cropItem) return;

    cropsMap.set(c.pickupableItem.id, {
      name: en[cropItem.displayName] || cropItem.displayName,
      type: 'fruit_tree',
      season: (c.growableSeason || []).join('/'),
      town_rank: mapTownRank(cropItem.tags, 'C'),
      grow_days: null,
      seed_price: seedItem.price || Math.floor((cropItem.sellPrice || 0) * 0.4),
      sell_price: cropItem.sellPrice,
      regrowth_days: null,
      notes: '3x3 clear space needed. No watering. Dormant off-season.'
    });
  });

  // Convert to array and calculate quality prices
  const rows = Array.from(cropsMap.values()).map(c => {
    c.price_bronze = Math.floor(c.sell_price * 1.15);
    c.price_silver = Math.floor(c.sell_price * 1.30);
    c.price_gold   = Math.floor(c.sell_price * 1.50);
    c.price_osmium = Math.floor(c.sell_price * 2.00);
    return c;
  });

  rows.sort((a, b) => a.name.localeCompare(b.name));

  const out = path.join(__dirname, '..', 'data', 'crops.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(rows, null, 2) + '\n');
  console.log(`Wrote ${rows.length} crops to ${out}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
