CREATE TABLE IF NOT EXISTS ai_answer_feedback (
  id BIGSERIAL PRIMARY KEY,
  search_log_id BIGINT REFERENCES search_logs(id) ON DELETE CASCADE,
  user_id UUID,
  rating TEXT NOT NULL CHECK (rating IN ('up', 'down', 'wrong', 'missing')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (search_log_id, user_id)
);

CREATE INDEX IF NOT EXISTS ai_answer_feedback_search_log_idx ON ai_answer_feedback (search_log_id);
CREATE INDEX IF NOT EXISTS ai_answer_feedback_rating_created_at_idx ON ai_answer_feedback (rating, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_answer_feedback_user_created_at_idx ON ai_answer_feedback (user_id, created_at DESC);
