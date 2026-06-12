require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: [
    'https://coral-island-db.vercel.app',
    'https://coralislanddb.com',
    'https://www.coralislanddb.com',
    /^http:\/\/localhost(:\d+)?$/,
  ],
}));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', app: 'Coral Island DB', version: 2 });
});

// API routes
app.use('/api/crops', require('./routes/crops'));
app.use('/api/caves', require('./routes/caves'));
app.use('/api/forageables', require('./routes/foraging'));
app.use('/api/collectibles', require('./routes/collectibles'));
app.use('/api/crafting', require('./routes/crafting'));
app.use('/api/cooking', require('./routes/cooking'));
app.use('/api/npcs', require('./routes/npcs'));
app.use('/api/search', require('./routes/search'));
app.use('/api/admin',  require('./routes/admin'));
app.use('/api/plans',  require('./routes/plans'));
app.use('/api/checklists', require('./routes/checklists'));
app.use('/api/itinerary', require('./routes/itinerary'));
app.use('/api/offerings', require('./routes/offerings'));
app.use('/api/products', require('./routes/products'));
app.use('/api/tools', require('./routes/tools'));

// search_logs retention — prune entries older than 90 days on boot and daily,
// so the table (and the admin views' COUNT(*) queries) don't grow unbounded.
const pool = require('./db');
async function pruneSearchLogs() {
  try {
    const r = await pool.query("DELETE FROM search_logs WHERE created_at < NOW() - INTERVAL '90 days'");
    if (r.rowCount > 0) console.log(`Pruned ${r.rowCount} search log(s) older than 90 days`);
  } catch (err) {
    console.error('search_logs prune failed:', err.message);
  }
}
pruneSearchLogs();
setInterval(pruneSearchLogs, 24 * 60 * 60 * 1000).unref();

// Auto-create ai_plans table if it doesn't exist (migration)
pool.query(`
  CREATE TABLE IF NOT EXISTS ai_plans (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    query TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS user_checklists (
    user_id UUID PRIMARY KEY,
    tasks JSONB DEFAULT '[]'::jsonb
  );
`).then(() => console.log('Checked ai_plans and user_checklists tables.'))
  .catch(err => console.error('Failed to create tables:', err.message));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Coral Island DB API listening on http://localhost:${PORT}`);
});
