ALTER TABLE search_logs ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'ai';
CREATE INDEX IF NOT EXISTS search_logs_source_created_at_idx ON search_logs (source, created_at DESC);
