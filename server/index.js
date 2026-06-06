require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());            // allow all origins (fine for dev; tighten in prod if desired)
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', app: 'Coral Island DB' });
});

// API routes
app.use('/api/crops', require('./routes/crops'));
app.use('/api/caves', require('./routes/caves'));
app.use('/api/forageables', require('./routes/foraging'));
app.use('/api/npcs', require('./routes/npcs'));
app.use('/api/search', require('./routes/search'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Coral Island DB API listening on http://localhost:${PORT}`);
});
