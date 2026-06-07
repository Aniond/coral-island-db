/**
 * Builds server/data/crafting-recipes.json — the full crafting recipe list
 * data-mined from coral-island-guide.
 *
 * Each recipe resolves its output (name / icon / description) via items.json +
 * the English localization table, and its ingredients (specific items + generic
 * "any X" ingredients) into a structured list with per-ingredient icons.
 *
 * Usage:  node scripts/build-crafting.js
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

// Readable labels for "generic" / category ingredients (not real items).
const GENERIC = {
  Generic_TreeSeed:       'Any Tree Seed',
  Generic_Flower:         'Any Flower',
  Generic_Insect:         'Any Insect',
  Generic_SmallFish:      'Any Small Fish',
  Generic_Ore:            'Any Ore',
  Any_Fish:               'Any Fish',
  Any_Egg:                'Any Egg',
  Any_Honey:              'Any Honey',
  Any_Wool:               'Any Wool',
  Any_SeaScavenge:        'Any Sea Scavengeable',
  Any_BeachScavenge:      'Any Beach Scavengeable',
  Any_DriedScavengables:  'Any Dried Scavengeable',
  Any_MonsterEssence:     'Any Monster Essence',
};
const prettify = (s) => s.replace(/^(Generic|Any)_/, '').replace(/([a-z])([A-Z])/g, '$1 $2');
const iconUrl = (n) => (n ? `${ICON_BASE}/${n}.webp` : null);

async function main() {
  const [recipes, items, en] = await Promise.all([
    getJson(`${BASE}/crafting-recipes.json`),
    getJson(`${BASE}/items.json`),
    getJson(`${BASE}/i18n/en.json`),
  ]);
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));

  const rows = recipes.map((r) => {
    const out = byId[r.key];
    const ingredients = [
      ...(r.ingredients || []).map((i) => ({
        name:   en[i.item.displayName] || i.item.displayName,
        amount: i.amount,
        icon:   iconUrl(i.item.iconName),
      })),
      ...(r.genericIngredients || []).map((g) => ({
        name:   GENERIC[g.key] || ('Any ' + prettify(g.key)),
        amount: g.amount,
        icon:   null,
      })),
    ];
    return {
      name:          en[r.displayName] || r.displayName,
      output_amount: r.amount || 1,
      category:      r.category || 'Misc',
      mastery_type:  r.craftingUnlock?.masteryType || null,
      mastery_level: r.craftingUnlock?.masteryLevel ?? null,
      ingredients,   // array; stringified at seed time for the TEXT column
      description:   (out && en[out.description] || '').trim() || null,
      image_url:     out ? iconUrl(out.iconName) : null,
    };
  });

  rows.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

  const outPath = path.join(__dirname, '..', 'data', 'crafting-recipes.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(rows, null, 2) + '\n');
  const byCat = rows.reduce((a, r) => { a[r.category] = (a[r.category] || 0) + 1; return a; }, {});
  console.log(`Wrote ${rows.length} crafting recipes to ${outPath}`);
  console.log('by category:', JSON.stringify(byCat));
  console.log('with icon:', rows.filter((r) => r.image_url).length, '| with description:', rows.filter((r) => r.description).length);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
