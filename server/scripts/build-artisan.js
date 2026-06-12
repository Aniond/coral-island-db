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
  const [items, en] = await Promise.all([
    getJson(`${BASE}/items.json`),
    getJson(`${BASE}/i18n/en.json`),
  ]);

  const artisan = items.filter(i => i.inventoryCategory === 'ArtisanProduct');
  const rows = artisan.map(it => {
    return {
      name: en[it.displayName] || it.displayName,
      sell_price: it.sellPrice ?? null,
      description: (en[it.description] || '').trim() || null,
      image_url: it.iconName ? `${ICON_BASE}/${it.iconName}.webp` : null
    };
  });

  rows.sort((a, b) => a.name.localeCompare(b.name));

  const out = path.join(__dirname, '..', 'data', 'artisan-products.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(rows, null, 2) + '\n');
  console.log(`Wrote ${rows.length} artisan products to ${out}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
