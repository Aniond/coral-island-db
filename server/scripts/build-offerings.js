const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE = 'https://raw.githubusercontent.com/koenigderluegner/coral-island-guide/main/packages/guide/src/assets/live/database';

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
  const [items, bundlesData, en] = await Promise.all([
    getJson(`${BASE}/items.json`),
    getJson(`${BASE}/offerings.json`),
    getJson(`${BASE}/i18n/en.json`),
  ]);

  const rows = [];
  bundlesData.forEach(altar => {
    const altarName = en[altar.offeringGroupTitle] || altar.offeringGroupTitle;
    if (altar.offerings) {
      altar.offerings.forEach(b => {
        const bundleName = en[b.title] || b.title;
        if (b.requiredItems) {
          b.requiredItems.forEach(req => {
            const item = items.find(i => i.id === req.item.id);
            if (!item) return;
            const itemName = en[item.displayName] || item.displayName;
            const qualityStr = req.quality === 'base' ? 'Base' : 
                               req.quality === 'bronze' ? 'Bronze' : 
                               req.quality === 'silver' ? 'Silver' : 
                               req.quality === 'gold' ? 'Gold' : 'Osmium';
            
            rows.push({
              altar_name: altarName,
              bundle_name: bundleName,
              item_name: itemName,
              amount: req.amount,
              quality: qualityStr
            });
          });
        }
      });
    }
  });

  const out = path.join(__dirname, '..', 'data', 'goddess-offerings.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(rows, null, 2) + '\n');
  console.log(`Wrote ${rows.length} offerings to ${out}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
