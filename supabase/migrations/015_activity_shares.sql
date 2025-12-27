-- 015_activity_shares.sql
-- Log share events for activities so we can build time-series metrics

CREATE TABLE IF NOT EXISTS activity_shares (
  id BIGSERIAL PRIMARY KEY,
  activity_id BIGINT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NULL,
  visitor_id TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_shares_activity_id_created_at ON activity_shares(activity_id, created_at DESC);
