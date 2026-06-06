-- Auth support tables
-- Run once against the Railway PostgreSQL database.

CREATE TABLE IF NOT EXISTS user_roles (
  user_id    TEXT PRIMARY KEY,
  role       TEXT NOT NULL DEFAULT 'user',
  email      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS search_logs (
  id         SERIAL PRIMARY KEY,
  user_id    TEXT,
  query      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS search_logs_user_id_idx ON search_logs (user_id);
CREATE INDEX IF NOT EXISTS search_logs_created_at_idx ON search_logs (created_at DESC);
