const http = require('http');

const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:3001';

function getJson(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`${baseUrl}${path}`, { timeout: 8000 }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch {}
        resolve({ status: res.statusCode, body, json });
      });
    });
    req.on('timeout', () => {
      req.destroy(new Error(`Timed out requesting ${path}`));
    });
    req.on('error', reject);
  });
}

async function assertOk(name, path, predicate) {
  const result = await getJson(path);
  if (!predicate(result)) {
    throw new Error(`${name} failed: HTTP ${result.status} ${result.body.slice(0, 160)}`);
  }
  console.log(`ok - ${name}`);
}

async function main() {
  console.log(`Smoke testing ${baseUrl}`);
  await assertOk('root health', '/', result => result.status === 200 && result.json?.status === 'ok');
  await assertOk('crops endpoint', '/api/crops', result => result.status === 200 && Array.isArray(result.json));
  await assertOk('search index', '/api/search/index', result => result.status === 200 && Array.isArray(result.json));
  await assertOk('deep health', '/api/health/deep', result => result.status === 200 && result.json?.status === 'ok');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
