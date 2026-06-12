const https = require('https');
const fs = require('fs');
const path = require('path');

const URLS = {
  blacksmith: 'https://raw.githubusercontent.com/koenigderluegner/coral-island-guide/main/packages/guide/src/assets/live/database/blacksmith-item-upgrade.json',
  lab: 'https://raw.githubusercontent.com/koenigderluegner/coral-island-guide/main/packages/guide/src/assets/live/database/lab-item-upgrade.json',
  items: 'https://raw.githubusercontent.com/koenigderluegner/coral-island-guide/main/packages/guide/src/assets/live/database/items.json',
  en: 'https://raw.githubusercontent.com/koenigderluegner/coral-island-guide/main/packages/guide/src/assets/live/database/i18n/en.json'
};

const fetchJson = (url) => new Promise((resolve, reject) => {
  https.get(url, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => resolve(JSON.parse(body)));
  }).on('error', reject);
});

async function buildTools() {
  console.log('Fetching coral.guide database tools...');
  try {
    const [blacksmithData, labData, itemsData, enData] = await Promise.all([
      fetchJson(URLS.blacksmith),
      fetchJson(URLS.lab),
      fetchJson(URLS.items),
      fetchJson(URLS.en)
    ]);

    const tools = [];

    const processData = (dataArray) => {
      dataArray.forEach(t => {
        if (!t.item || !t.item.id) return;
        
        const itemObj = itemsData.find(i => i.id === t.item.id);
        if (!itemObj) return;

        const name = enData[itemObj.displayName] || itemObj.displayName;
        const toolType = t.toolType || itemObj.itemType || 'Upgrade';
        const tier = t.hardnessLevel || t.upgradeLevel || 'Unknown';
        
        const requirements = (t.requirements || []).map(req => {
          const reqItemObj = itemsData.find(i => i.id === req.item.id);
          const reqName = reqItemObj ? (enData[reqItemObj.displayName] || reqItemObj.displayName) : req.item.id;
          return { name: reqName, amount: req.amount };
        });

        tools.push({
          name: name,
          tool_type: toolType,
          tier: tier,
          price: t.price || 0,
          days_delay: t.daysDelay || 0,
          requirements: requirements
        });
      });
    };

    processData(blacksmithData);
    processData(labData);

    const outPath = path.join(__dirname, '..', 'data', 'tools.json');
    fs.writeFileSync(outPath, JSON.stringify(tools, null, 2));
    console.log(`Wrote ${tools.length} tools/upgrades to ${outPath}`);

  } catch (err) {
    console.error('Failed to build tools:', err);
  }
}

buildTools();
