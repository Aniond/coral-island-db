require('dotenv').config();
const pool = require('../db');
const { tryDirectAnswer } = require('../ai/directAnswers');
const { buildRelevantContext } = require('../ai/retrieval');

const CASES = [
  {
    name: 'NPC gift direct answer',
    query: 'What gifts does Wakuu love?',
    expectedDirect: true,
    answerIncludes: ['Wakuu', 'Loved gifts'],
  },
  {
    name: 'Crop profit direct answer',
    query: 'What are the best summer crops for profit?',
    expectedDirect: true,
    answerIncludes: ['Best Summer Crop Profit', '| Crop |'],
  },
  {
    name: 'Recipe direct answer',
    query: 'How do I craft a sprinkler?',
    expectedDirect: true,
    answerIncludes: ['Ingredients'],
  },
  {
    name: 'Offering direct answer',
    query: 'What do I need for the rare crop offering?',
    expectedDirect: true,
    answerIncludes: ['Goddess Offering Requirements', 'Rare'],
  },
  {
    name: 'Tool upgrade direct answer',
    query: 'How much does the silver pickaxe upgrade cost?',
    expectedDirect: true,
    answerIncludes: ['Cost', 'Requirements'],
  },
  {
    name: 'Collectibles list direct answer',
    query: 'What fish can I catch in summer?',
    expectedDirect: true,
    answerIncludes: ['Summer Fish List', '| Name |'],
  },
  {
    name: 'Planning should route to AI context',
    query: 'What should I do today in Spring?',
    expectedDirect: false,
    contextIncludes: ['# CROPS', '# NPCS'],
  },
  {
    name: 'Offering planning context retrieval',
    query: 'What should I do today for the rare crop offering?',
    expectedDirect: false,
    contextIncludes: ['GODDESS OFFERINGS'],
  },
];

function assertIncludes(label, value, snippets) {
  for (const snippet of snippets || []) {
    if (!String(value || '').includes(snippet)) {
      throw new Error(`${label} missing "${snippet}"`);
    }
  }
}

async function runCase(testCase) {
  const direct = await tryDirectAnswer(testCase.query);
  const hasDirect = Boolean(direct);
  if (hasDirect !== testCase.expectedDirect) {
    throw new Error(`expected direct=${testCase.expectedDirect}, got ${hasDirect}`);
  }
  if (direct) {
    assertIncludes('direct answer', direct, testCase.answerIncludes);
    return { mode: 'direct', responseChars: direct.length };
  }

  const context = await buildRelevantContext(testCase.query, {});
  assertIncludes('retrieved context', context.text, testCase.contextIncludes);
  if (!context.text || context.text.length < 200) {
    throw new Error('retrieved context is unexpectedly small');
  }
  return {
    mode: 'retrieval',
    contextChars: context.text.length,
    retrievedDocs: context.retrievedDocs,
  };
}

async function main() {
  let passed = 0;
  const results = [];
  for (const testCase of CASES) {
    try {
      const result = await runCase(testCase);
      passed += 1;
      results.push({ name: testCase.name, ok: true, ...result });
      console.log(`ok - ${testCase.name}`);
    } catch (err) {
      results.push({ name: testCase.name, ok: false, error: err.message });
      console.error(`not ok - ${testCase.name}: ${err.message}`);
    }
  }

  console.log(JSON.stringify({ passed, total: CASES.length, results }, null, 2));
  if (passed !== CASES.length) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
