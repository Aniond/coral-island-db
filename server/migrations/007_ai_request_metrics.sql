CREATE TABLE IF NOT EXISTS ai_request_metrics (
  id BIGSERIAL PRIMARY KEY,
  search_log_id BIGINT REFERENCES search_logs(id) ON DELETE SET NULL,
  user_id UUID NULL,
  source TEXT NOT NULL,
  model TEXT NULL,
  status TEXT NOT NULL,
  query_chars INTEGER NOT NULL DEFAULT 0,
  history_messages INTEGER NOT NULL DEFAULT 0,
  history_chars INTEGER NOT NULL DEFAULT 0,
  context_chars INTEGER NOT NULL DEFAULT 0,
  retrieved_docs INTEGER NOT NULL DEFAULT 0,
  response_chars INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  cache_hit BOOLEAN NOT NULL DEFAULT false,
  used_tool_call BOOLEAN NOT NULL DEFAULT false,
  aborted BOOLEAN NOT NULL DEFAULT false,
  error TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_request_metrics_created_at_idx ON ai_request_metrics (created_at DESC);
CREATE INDEX IF NOT EXISTS ai_request_metrics_source_created_at_idx ON ai_request_metrics (source, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_request_metrics_user_created_at_idx ON ai_request_metrics (user_id, created_at DESC);
