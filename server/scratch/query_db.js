require('dotenv').config({ path: '../.env' });
const pool = require('../db');
pool.query("SELECT name, town_rank FROM crops WHERE name='Strawberry'")
  .then(res => { console.log(res.rows); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
