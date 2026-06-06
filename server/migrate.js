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

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, 'migrations', '001_auth_tables.sql'), 'utf8');
  console.log('Running migration 001_auth_tables.sql…');
  await pool.query(sql);
  console.log('Done.');
  await pool.end();
}

main().catch(err => { console.error(err.message); process.exit(1); });
