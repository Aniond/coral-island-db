-- Add response column to search_logs
ALTER TABLE search_logs ADD COLUMN IF NOT EXISTS response TEXT;
