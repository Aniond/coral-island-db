require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query('SELECT query, response, created_at, user_id FROM search_logs ORDER BY created_at DESC LIMIT 5');
    console.log('Recent search logs:');
    res.rows.forEach(r => {
      console.log(`[${r.created_at}] User: ${r.user_id}`);
      console.log(`Query: ${r.query}`);
      console.log(`Response: ${r.response}`);
      console.log('---');
    });
  } catch(e) {
    console.error('Error:', e.message);
  }
  pool.end();
}
run();
