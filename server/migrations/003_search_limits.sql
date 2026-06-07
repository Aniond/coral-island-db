-- Global + default-per-user AI search "testing limits", editable from the admin
-- dashboard, plus a master on/off toggle. Stored as key/value config so they can
-- be changed at runtime without a deploy and survive data re-seeds.
CREATE TABLE IF NOT EXISTS app_settings (
  key        VARCHAR(64) PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_settings (key, value) VALUES
  ('global_daily_search_limit', '50'),        -- total AI searches/day across all users
  ('default_user_daily_search_limit', '50'),  -- fallback per-user/day cap (NULL per-user limit uses this)
  ('search_limits_enabled', 'true')           -- master switch: false = no limits enforced
ON CONFLICT (key) DO NOTHING;
