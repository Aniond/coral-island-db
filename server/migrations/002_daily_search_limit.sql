-- Add per-user daily search limit. NULL means unlimited.
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS daily_search_limit INTEGER DEFAULT NULL;
