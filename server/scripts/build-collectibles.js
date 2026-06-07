/**
 * Builds server/data/collectibles.json — the full museum/journal collectible
 * audit (fish, insects, sea critters, fossils, artifacts, gems) data-mined from
 * the open-source coral-island-guide project.
 *
 * For every category we take the journal file (canonical museum order) and
 * resolve each item id via items.json + the English localization table to get
 * name / sell price / description / icon. Fish, insects and sea critters are
 * enriched with season / location / time-of-day from their detail files.
 *
 * Usage:  node scripts/build-collectibles.js
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
const SEASONS  = ['spring', 'summer', 'fall', 'winter'];
const TIMES    = ['morning', 'afternoon', 'evening', 'night'];

// boolean-flag object -> "Spring, Fall" | "All seasons" | null
function seasonStr(obj) {
  if (!obj) return null;
  const on = SEASONS.filter((k) => obj[k]);
  if (on.length === 0) return null;
  if (on.length === 4) return 'All seasons';
  return on.map(cap).join(', ');
}
function timeStr(obj) {
  if (!obj) return null;
  const on = TIMES.filter((k) => obj[k]);
  if (on.length === 0 || on.length === 4) return 'Any time';
  return on.map(cap).join(', ');
}
const uniq = (a) => [...new Set(a.filter(Boolean))];

async function main() {
  const cats = ['fish', 'insects', 'sea-critters', 'fossils', 'artifacts', 'gems'];
  const [items, en, fishDetail, bugDetail, critterDetail, ...journals] = await Promise.all([
    getJson(`${BASE}/items.json`),
    getJson(`${BASE}/i18n/en.json`),
    getJson(`${BASE}/fish.json`),
    getJson(`${BASE}/bugs-and-insects.json`),
    getJson(`${BASE}/ocean-critters.json`),
    ...cats.map((c) => getJson(`${BASE}/journal-${c}.json`)),
  ]);
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const journalByCat = Object.fromEntries(cats.map((c, i) => [c, journals[i]]));

  // Detail lookups keyed by item id
  const fishById = {};
  for (const f of fishDetail) {
    const id = f.item?.id; if (!id) continue;
    const seasons = uniq(f.spawnSettings.flatMap((s) => SEASONS.filter((k) => s.spawnSeason?.[k]).map(cap)));
    const times   = uniq(f.spawnSettings.flatMap((s) => TIMES.filter((k) => s.spawnTime?.[k]).map(cap)));
    const locs    = uniq(f.spawnSettings.flatMap((s) => s.spawnLocation || []));
    fishById[id] = {
      rarity: f.rarity,
      seasons: seasons.length === 4 ? 'All seasons' : (seasons.join(', ') || null),
      time_of_day: (times.length === 0 || times.length === 4) ? 'Any time' : times.join(', '),
      locations: locs.join(', ') || null,
    };
  }
  const flagDetailById = (arr) => {
    const out = {};
    for (const x of arr) {
      const id = x.item?.id; if (!id) continue;
      out[id] = {
        rarity: x.rarity,
        seasons: seasonStr(x.spawnSeason),
        time_of_day: timeStr(x.spawnTime),
        locations: (x.spawnLocation || []).join(', ') || null,
      };
    }
    return out;
  };
  const bugById = flagDetailById(bugDetail);
  const critterById = flagDetailById(critterDetail);

  const CATEGORY = {
    fish:           { cat: 'fish',        detail: fishById },
    insects:        { cat: 'insect',      detail: bugById },
    'sea-critters': { cat: 'sea_critter', detail: critterById },
    fossils:        { cat: 'fossil',      detail: null },
    artifacts:      { cat: 'artifact',    detail: null },
    gems:           { cat: 'gem',         detail: null },
  };

  const rows = [];
  for (const c of cats) {
    const { cat, detail } = CATEGORY[c];
    for (const entry of journalByCat[c]) {
      const it = byId[entry.key];
      if (!it) { console.warn('unresolved', c, entry.key); continue; }
      const name = en[it.displayName] || it.displayName;
      const description = (en[it.description] || '').trim() || null;
      const d = detail ? detail[entry.key] : null;
      rows.push({
        category:    cat,
        name,
        sell_price:  it.sellPrice ?? null,
        rarity:      d?.rarity || null,
        seasons:     d?.seasons || null,
        locations:   d?.locations || null,
        time_of_day: d?.time_of_day || null,
        description,
        icon:        it.iconName ? `${ICON_BASE}/${it.iconName}.webp` : null,
        sort_order:  entry.order ?? 0,
      });
    }
  }

  const out = path.join(__dirname, '..', 'data', 'collectibles.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(rows, null, 2) + '\n');
  const counts = rows.reduce((a, r) => { a[r.category] = (a[r.category] || 0) + 1; return a; }, {});
  console.log(`Wrote ${rows.length} collectibles to ${out}`);
  console.log('by category:', JSON.stringify(counts));
}

main().catch((e) => { console.error(e.message); process.exit(1); });
