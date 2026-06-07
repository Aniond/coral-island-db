-- Coral Island DB schema
-- Dropping first makes re-seeding idempotent.

DROP TABLE IF EXISTS crops CASCADE;
CREATE TABLE crops (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  type VARCHAR(50),         -- 'seed', 'fruit_plant', 'fruit_tree', 'ocean_crop'
  season VARCHAR(100),      -- 'spring', 'summer', 'fall', 'winter', 'all', or combos like 'summer/fall'
  town_rank VARCHAR(5),     -- 'F', 'E', 'D', 'C', 'B', 'A'
  grow_days INTEGER,
  sell_price INTEGER,
  regrowth_days INTEGER,    -- null if one-time harvest
  notes TEXT
);

DROP TABLE IF EXISTS cave_items CASCADE;
CREATE TABLE cave_items (
  id SERIAL PRIMARY KEY,
  cave VARCHAR(50),         -- 'earth', 'water', 'wind', 'fire', 'memories'
  item_name VARCHAR(100),
  item_type VARCHAR(50),    -- 'ore', 'gem', 'geode', 'monster_drop', 'fish', 'scavengeable'
  floor_range VARCHAR(50),  -- e.g. '1-20', 'all floors'
  notes TEXT
);

DROP TABLE IF EXISTS forageables CASCADE;
CREATE TABLE forageables (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  season VARCHAR(50),
  location VARCHAR(200),
  area VARCHAR(100),        -- general area tag: land, beach, ocean, forest, misc
  notes TEXT,
  sell_price INTEGER,
  image_url TEXT
);

DROP TABLE IF EXISTS cooking_recipes CASCADE;
CREATE TABLE cooking_recipes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150),
  utensil VARCHAR(40),       -- Oven, Pot, Grill, Chef Knife… (tool needed)
  ingredients TEXT,          -- JSON array of {name, amount, icon}
  buff VARCHAR(80),          -- skill/stat bonus, e.g. 'Fishing +3' (null = none)
  buff_duration_min INTEGER,
  health INTEGER,            -- HP restored
  energy INTEGER,            -- stamina restored
  sell_price INTEGER,
  description TEXT,
  image_url TEXT
);

DROP TABLE IF EXISTS crafting_recipes CASCADE;
CREATE TABLE crafting_recipes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150),
  output_amount INTEGER,
  category VARCHAR(60),       -- Misc, Farming, Artisan, Decor, Scarecrow
  mastery_type VARCHAR(40),   -- unlock skill (Farming, Mining…); null = no requirement
  mastery_level INTEGER,
  ingredients TEXT,           -- JSON array of {name, amount, icon}
  description TEXT,
  image_url TEXT              -- output item icon
);

DROP TABLE IF EXISTS collectibles CASCADE;
CREATE TABLE collectibles (
  id SERIAL PRIMARY KEY,
  category VARCHAR(30),      -- 'fish','insect','sea_critter','fossil','artifact','gem'
  name VARCHAR(120),
  sell_price INTEGER,
  rarity VARCHAR(30),        -- fish/insects/critters only
  seasons VARCHAR(80),       -- fish/insects/critters only
  locations VARCHAR(255),
  time_of_day VARCHAR(60),
  description TEXT,
  icon TEXT,                 -- item icon URL
  sort_order INTEGER         -- museum/journal display order
);

DROP TABLE IF EXISTS npcs CASCADE;
CREATE TABLE npcs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  role VARCHAR(100),
  location VARCHAR(100),
  schedule TEXT,
  loved_gifts TEXT,
  liked_gifts TEXT,
  quest_summary TEXT,
  birthday VARCHAR(50),       -- e.g. 'Summer 8' (season + day)
  image_url TEXT              -- portrait URL (coral.guide head-portraits)
);

-- App-level config (key/value). NOT dropped on re-seed — it holds admin-tuned
-- settings like the AI-search testing limits, which must survive a data re-seed.
CREATE TABLE IF NOT EXISTS app_settings (
  key        VARCHAR(64) PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the AI-search testing limits (editable from the admin dashboard).
-- global_daily_search_limit:        total AI searches/day across everyone
-- default_user_daily_search_limit:  fallback per-user/day cap when no explicit limit is set
-- search_limits_enabled:            master on/off switch for all the above
INSERT INTO app_settings (key, value) VALUES
  ('global_daily_search_limit', '50'),
  ('default_user_daily_search_limit', '50'),
  ('search_limits_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
