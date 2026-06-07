// Run DB migrations — execute once after deploying auth support.
// Usage: DATABASE_URL=... node migrate.js
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const MIGRATIONS = [
  '001_auth_tables.sql',
  '002_daily_search_limit.sql',
  '003_search_limits.sql',
];

async function main() {
  for (const file of MIGRATIONS) {
    const sql = fs.readFileSync(path.join(__dirname, 'migrations', file), 'utf8');
    console.log(`Running ${file}…`);
    await pool.query(sql);
    console.log(`  Done.`);
  }
  await pool.end();
}

main().catch(err => { console.error(err.message); process.exit(1); });
