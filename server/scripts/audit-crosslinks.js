require('dotenv').config();

const pool = require('../db');
const {
  buildItemSourceIndex,
  findItemSources,
  isGenericReference,
  parseItemList,
} = require('../ai/crosslinks');

function addReference(refs, area, owner, item) {
  const name = item.name || item.item_name || String(item);
  refs.push({
    area,
    owner,
    item: name,
    amount: item.amount || 1,
  });
}

async function collectReferences() {
  const [crafting, cooking, offerings, tools] = await Promise.all([
    pool.query('SELECT name, ingredients FROM crafting_recipes ORDER BY name'),
    pool.query('SELECT name, ingredients FROM cooking_recipes ORDER BY name'),
    pool.query('SELECT altar_name, bundle_name, item_name, amount, quality FROM goddess_offerings ORDER BY altar_name, bundle_name, item_name'),
    pool.query('SELECT name, requirements FROM tools ORDER BY name'),
  ]);

  const refs = [];
  for (const row of crafting.rows) {
    for (const item of parseItemList(row.ingredients)) addReference(refs, 'crafting', row.name, item);
  }
  for (const row of cooking.rows) {
    for (const item of parseItemList(row.ingredients)) addReference(refs, 'cooking', row.name, item);
  }
  for (const row of offerings.rows) {
    addReference(refs, 'offering', `${row.altar_name} / ${row.bundle_name}`, row);
  }
  for (const row of tools.rows) {
    for (const item of parseItemList(row.requirements)) addReference(refs, 'tool', row.name, item);
  }
  return refs;
}

async function main() {
  const [sourceIndex, refs] = await Promise.all([
    buildItemSourceIndex(),
    collectReferences(),
  ]);
  const totals = {
    references: refs.length,
    linked: 0,
    generic: 0,
    unresolved: 0,
  };
  const unresolved = [];
  const generic = [];

  for (const ref of refs) {
    if (isGenericReference(ref.item)) {
      totals.generic += 1;
      if (generic.length < 25) generic.push(ref);
      continue;
    }
    const sources = findItemSources(ref.item, sourceIndex);
    if (sources.length) {
      totals.linked += 1;
      continue;
    }
    totals.unresolved += 1;
    if (unresolved.length < 50) unresolved.push(ref);
  }

  const byArea = refs.reduce((acc, ref) => {
    acc[ref.area] = (acc[ref.area] || 0) + 1;
    return acc;
  }, {});

  const result = {
    ok: true,
    totals,
    byArea,
    unresolvedExamples: unresolved,
    genericExamples: generic,
    strictMode: process.env.STRICT_CROSSLINKS === '1',
  };

  console.log(JSON.stringify(result, null, 2));
  if (result.strictMode && totals.unresolved > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
