/**
 * Builds server/data/forageables.json — the full foraging / gathering list
 * (inventoryCategory "Scavengeable") data-mined from coral-island-guide.
 *
 * Each item resolves to name / sell price / description / icon via items.json +
 * the English localization table. Season + area are derived from the item's
 * gathering tags (item.gathering.<season>, .beach, .sea, income.diving …).
 *
 * Usage:  node scripts/build-forageables.js
 */
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

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const SEASONS = ['spring', 'summer', 'fall', 'winter'];

function deriveSeason(tags) {
  const lc = tags.map((t) => t.toLowerCase());
  const found = SEASONS.filter((s) => lc.some((t) => t.includes('gathering.' + s)));
  if (found.length === 0) return null;          // not season-gated
  if (found.length >= 4) return 'all';
  return found.map(cap).join('/');
}

function deriveArea(tags) {
  const lc = tags.map((t) => t.toLowerCase());
  const has = (s) => lc.some((t) => t.includes(s));
  if (has('gathering.beach'))                       return { area: 'beach',  location: 'Beach shoreline' };
  if (has('income.diving') || has('gathering.sea')) return { area: 'ocean',  location: 'Ocean floor (diving)' };
  if (has('mushroom'))                              return { area: 'forest', location: 'Forest & caves' };
  if (SEASONS.some((s) => has('gathering.' + s)))   return { area: 'land',   location: 'Foraged on land' };
  return { area: 'misc', location: 'Various' };
}

async function main() {
  const [items, en] = await Promise.all([
    getJson(`${BASE}/items.json`),
    getJson(`${BASE}/i18n/en.json`),
  ]);

  const scav = items.filter((i) => i.inventoryCategory === 'Scavengeable');
  const rows = scav.map((it) => {
    const tags = it.tags || [];
    const season = deriveSeason(tags);
    const { area, location } = deriveArea(tags);
    return {
      name:       en[it.displayName] || it.displayName,
      season:     season || (area === 'ocean' ? 'all' : 'all'),
      location,
      area,
      notes:      (en[it.description] || '').trim() || null,
      sell_price: it.sellPrice ?? null,
      image_url:  it.iconName ? `${ICON_BASE}/${it.iconName}.webp` : null,
    };
  });

  // Stable, readable order: by area then name
  const areaRank = { land: 0, beach: 1, ocean: 2, forest: 3, misc: 4 };
  rows.sort((a, b) => (areaRank[a.area] - areaRank[b.area]) || a.name.localeCompare(b.name));

  const out = path.join(__dirname, '..', 'data', 'forageables.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(rows, null, 2) + '\n');
  const byArea = rows.reduce((a, r) => { a[r.area] = (a[r.area] || 0) + 1; return a; }, {});
  console.log(`Wrote ${rows.length} forageables to ${out}`);
  console.log('by area:', JSON.stringify(byArea));
}

main().catch((e) => { console.error(e.message); process.exit(1); });
