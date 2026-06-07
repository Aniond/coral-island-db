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
