-- Coral Island DB schema
-- Dropping first makes re-seeding idempotent.

DROP TABLE IF EXISTS crops CASCADE;
CREATE TABLE crops (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(50),         -- 'seed', 'fruit_plant', 'fruit_tree', 'ocean_crop'
  season VARCHAR(100),      -- 'spring', 'summer', 'fall', 'winter', 'all', or combos like 'summer/fall'
  town_rank VARCHAR(5),     -- 'F', 'E', 'D', 'C', 'B', 'A'
  grow_days INTEGER,
  seed_price INTEGER,
  sell_price INTEGER,       -- Base quality price
  price_bronze INTEGER,     -- Base * 1.15
  price_silver INTEGER,     -- Base * 1.30
  price_gold INTEGER,       -- Base * 1.50
  price_osmium INTEGER,     -- Base * 2.00
  regrowth_days INTEGER,    -- null if one-time harvest
  notes TEXT
);

DROP TABLE IF EXISTS cave_items CASCADE;
CREATE TABLE cave_items (
  id SERIAL PRIMARY KEY,
  cave VARCHAR(50) NOT NULL, -- 'earth', 'water', 'wind', 'fire', 'memories'
  item_name VARCHAR(100) NOT NULL,
  item_type VARCHAR(50),    -- 'ore', 'gem', 'geode', 'monster_drop', 'fish', 'scavengeable'
  floor_range VARCHAR(50),  -- e.g. '1-20', 'all floors'
  notes TEXT,
  UNIQUE (cave, item_name)
);

DROP TABLE IF EXISTS forageables CASCADE;
CREATE TABLE forageables (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
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
  name VARCHAR(150) NOT NULL UNIQUE,
  utensil VARCHAR(40),       -- Oven, Pot, Grill, Chef Knife… (tool needed)
  ingredients JSONB,         -- array of {name, amount, icon}; null for a few no-ingredient dishes
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
  name VARCHAR(150) NOT NULL UNIQUE,
  output_amount INTEGER,
  category VARCHAR(60) NOT NULL, -- Misc, Farming, Artisan, Decor, Scarecrow
  mastery_type VARCHAR(40),   -- unlock skill (Farming, Mining…); null = no requirement
  mastery_level INTEGER,
  ingredients JSONB NOT NULL, -- array of {name, amount, icon}
  description TEXT,
  image_url TEXT              -- output item icon
);

DROP TABLE IF EXISTS collectibles CASCADE;
CREATE TABLE collectibles (
  id SERIAL PRIMARY KEY,
  category VARCHAR(30) NOT NULL, -- 'fish','insect','sea_critter','fossil','artifact','gem'
  name VARCHAR(120) NOT NULL,
  sell_price INTEGER,
  rarity VARCHAR(30),        -- fish/insects/critters only
  seasons VARCHAR(80),       -- fish/insects/critters only
  locations VARCHAR(255),
  time_of_day VARCHAR(60),
  description TEXT,
  icon TEXT,                 -- item icon URL
  sort_order INTEGER,        -- museum/journal display order
  UNIQUE (category, name)
);

DROP TABLE IF EXISTS npcs CASCADE;
CREATE TABLE npcs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
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

DROP TABLE IF EXISTS goddess_offerings CASCADE;
CREATE TABLE goddess_offerings (
  id SERIAL PRIMARY KEY,
  altar_name VARCHAR(100) NOT NULL,
  bundle_name VARCHAR(100) NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  amount INTEGER DEFAULT 1,
  quality VARCHAR(20) DEFAULT 'Base'
);

DROP TABLE IF EXISTS animal_products CASCADE;
CREATE TABLE animal_products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  sell_price INTEGER,
  description TEXT,
  image_url TEXT
);

DROP TABLE IF EXISTS artisan_products CASCADE;
CREATE TABLE artisan_products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  sell_price INTEGER,
  description TEXT,
  image_url TEXT
);

DROP TABLE IF EXISTS tools CASCADE;
CREATE TABLE tools (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  tool_type VARCHAR(255),
  tier VARCHAR(50),
  price INTEGER,
  days_delay INTEGER,
  requirements JSONB DEFAULT '[]'::jsonb
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

DROP TABLE IF EXISTS ai_plans CASCADE;
CREATE TABLE ai_plans (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  query TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TABLE IF EXISTS user_offerings CASCADE;
CREATE TABLE user_offerings (
  user_id UUID NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  PRIMARY KEY (user_id, item_name)
);
