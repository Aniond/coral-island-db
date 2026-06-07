/**
 * Builds server/data/cooking-recipes.json — the full cooking recipe list with
 * food buffs (skill/stat bonuses), data-mined from coral-island-guide.
 *
 * Joins cooking-recipes.json (ingredients + utensil) with consumables.json
 * (buff / level / duration / health & stamina restore) and items.json + the
 * English localization table (name / icon / description).
 *
 * Usage:  node scripts/build-cooking.js
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

// Internal buff name -> player-facing label
const BUFFS = {
  FarmingProficiency: 'Farming',  FishingProficiency: 'Fishing',  MiningProficiency: 'Mining',
  GatheringProficiency: 'Foraging', DivingProficiency: 'Diving',  RanchingProficiency: 'Ranching',
  CatchingProficiency: 'Catching', AttackBoost: 'Attack',         AddDefenseFlat: 'Defense',
  AddDefensePercentage: 'Defense %', ExtraStamina: 'Max Energy',  GoFast: 'Move Speed',
  DebuffImmunity: 'Debuff Immunity', GetDrunk: 'Tipsy', Burn: 'Burn (debuff)', Poison: 'Poison (debuff)',
  FlyingInsectScent: 'Flying Insect Scent', GroundInsectScent: 'Insect Scent',
  FlyingOceanCritterScent: 'Ocean Critter Scent', GroundOceanCritterScent: 'Ocean Critter Scent',
  MonsterSpawnIncrease: 'Monster Spawn +', MOnsterSpawnDecrease: 'Monster Spawn −', MonsterAggroIncrease: 'Monster Aggro +',
};
const UTENSIL = {
  Oven: 'Oven', Blender: 'Blender', ChefKnife: 'Chef Knife', FryingPan: 'Frying Pan',
  Skillet: 'Skillet', Grill: 'Grill', Pot: 'Pot', SeasoningSet: 'Seasoning Set', CeramicBowl: 'Ceramic Bowl',
};
const iconUrl = (n) => (n ? `${ICON_BASE}/${n}.webp` : null);
const prettify = (s) => s.replace(/^(Generic|Any)_/, '').replace(/([a-z])([A-Z])/g, '$1 $2');

function buffText(c) {
  if (!c || !c.buff || c.buff === 'None') return null;
  const label = BUFFS[c.buff] || c.buff;
  return c.level > 0 ? `${label} +${c.level}` : label;
}

async function main() {
  const [cookingRaw, consumables, items, en] = await Promise.all([
    getJson(`${BASE}/cooking-recipes.json`),
    getJson(`${BASE}/consumables.json`),
    getJson(`${BASE}/items.json`),
    getJson(`${BASE}/i18n/en.json`),
  ]);
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const consById = Object.fromEntries(consumables.map((c) => [c.key, c]));
  const cooking = cookingRaw[0]; // { Oven: [...], Blender: [...], ... }

  const rows = [];
  for (const [utensil, recipes] of Object.entries(cooking)) {
    for (const r of recipes) {
      const cons = consById[r.key];
      const out = byId[r.key] || r.item;
      const ingredients = [
        ...((r.ingredients || []).map((i) => ({
          name: en[i.item.displayName] || i.item.displayName,
          amount: i.amount,
          icon: iconUrl(i.item.iconName),
        }))),
        ...((r.genericIngredients || []).map((g) => ({
          name: en[g.genericItem?.displayName] || prettify(g.key),
          amount: g.amount,
          icon: iconUrl(g.genericItem?.iconName),
        }))),
      ];
      rows.push({
        name:        en[(out && out.displayName)] || r.cookingKey,
        utensil:     UTENSIL[utensil] || utensil,
        ingredients,
        buff:        buffText(cons),
        buff_duration_min: cons && cons.duration ? Math.round(cons.duration / 60) : null,
        health:      cons ? cons.healthDelta : null,
        energy:      cons ? cons.staminaDelta : null,
        sell_price:  out ? out.sellPrice ?? null : null,
        description: (out && en[out.description] || '').trim() || null,
        image_url:   out ? iconUrl(out.iconName) : null,
      });
    }
  }

  rows.sort((a, b) => a.name.localeCompare(b.name));

  const outPath = path.join(__dirname, '..', 'data', 'cooking-recipes.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(rows, null, 2) + '\n');
  const buffed = rows.filter((r) => r.buff).length;
  console.log(`Wrote ${rows.length} cooking recipes to ${outPath}`);
  console.log(`with buff: ${buffed} | with icon: ${rows.filter((r) => r.image_url).length}`);
  const skills = ['Farming', 'Fishing', 'Mining', 'Foraging', 'Diving', 'Ranching', 'Catching'];
  console.log('skill-boosting foods:', skills.map((s) => `${s}:${rows.filter((r) => r.buff && r.buff.startsWith(s)).length}`).join(', '));
}

main().catch((e) => { console.error(e.message); process.exit(1); });
