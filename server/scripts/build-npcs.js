/**
 * Regenerates server/data/npcs.json from the open-source Coral Island Guide
 * data-mined dataset (github.com/koenigderluegner/coral-island-guide).
 *
 * Pulls three "live" database files, resolves item names / NPC names / bios via
 * the English localization table, and writes the giftable NPC roster (loved &
 * liked gifts, birthday, bio, portrait URL) in the shape seed.js expects.
 *
 * Usage:  node scripts/build-npcs.js
 * Re-run after a game update to refresh gifts/art, then re-seed the DB.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE = 'https://raw.githubusercontent.com/koenigderluegner/coral-island-guide/main/packages/guide/src/assets/live/database';
const FILES = {
  npcs:  `${BASE}/npcs.json`,
  gifts: `${BASE}/gift-preferences.json`,
  en:    `${BASE}/i18n/en.json`,
};
// Public portrait CDN (same assets the live site serves).
const PORTRAIT_BASE = 'https://coral.guide/assets/live/head-portraits';

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

const splitCamel = (s) => s
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
const isHash = (s) => /^[0-9A-F]{24,}$/.test(s || '');

async function main() {
  const [npcs, gifts, en] = await Promise.all([
    getJson(FILES.npcs), getJson(FILES.gifts), getJson(FILES.en),
  ]);
  const npcByKey = Object.fromEntries(npcs.map((n) => [n.key, n]));

  const resolveName = (npc) => {
    const cn = npc.characterName;
    if (cn && en[cn]) return en[cn];
    if (cn && !isHash(cn) && !/^DT_/.test(cn)) return cn;
    return splitCamel(npc.key);
  };
  const resolveItem = (p) => (p.type === 'category'
    ? splitCamel(p.categoryName)
    : (en[p.item.displayName] || p.item.displayName));
  const uniq = (a) => [...new Set(a)];

  const role = (npc) => {
    if (npc.isDateable) return 'Marriage Candidate';
    if (npc.characterCategory === 'GiantFolks') return 'Giant Folk';
    if (npc.characterCategory === 'MerfolkKingdom') return 'Merfolk';
    return 'Townsfolk';
  };
  const rank = (npc) => (npc.isDateable ? 0
    : npc.characterCategory === 'CoralFolks' ? 1
    : npc.characterCategory === 'MerfolkKingdom' ? 2 : 3);

  const entries = [];
  for (const g of gifts) {
    const key = Object.keys(g)[0];
    if (key === 'ci_universal') continue;
    const d = g[key];
    const npc = npcByKey[key];
    if (!npc) { console.warn('No NPC meta for gift key:', key); continue; }
    const loved = uniq([...d.favoritePreferences.map(resolveItem), ...d.lovePreferences.map(resolveItem)]);
    const liked = uniq(d.likePreferences.map(resolveItem));
    const bd = npc.birthday && npc.birthday.day ? `${npc.birthday.season} ${npc.birthday.day}` : null;
    entries.push({ npc, name: resolveName(npc),
      loved_gifts: loved.join(', '), liked_gifts: liked.join(', '),
      quest_summary: (en[npc.description] || '').trim() || null,
      birthday: bd,
      image_url: npc.headerPortraitFileName ? `${PORTRAIT_BASE}/${key}/${npc.headerPortraitFileName}.webp` : null,
    });
  }

  entries.sort((a, b) => rank(a.npc) - rank(b.npc) || a.name.localeCompare(b.name));
  const rows = entries.map((e) => ({
    name: e.name, role: role(e.npc), location: null, schedule: null,
    loved_gifts: e.loved_gifts, liked_gifts: e.liked_gifts,
    quest_summary: e.quest_summary, birthday: e.birthday, image_url: e.image_url,
  }));

  const out = path.join(__dirname, '..', 'data', 'npcs.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(rows, null, 2) + '\n');
  console.log(`Wrote ${rows.length} NPCs to ${out}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
