-- 014_social_followers.sql
-- Store periodic follower counts for external social platforms (e.g. X/Twitter)

CREATE TABLE IF NOT EXISTS social_followers (
  id BIGSERIAL PRIMARY KEY,
  platform TEXT NOT NULL,
  handle TEXT NOT NULL,
  followers_count INTEGER NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_social_followers_platform_handle_fetched_at ON social_followers(platform, handle, fetched_at DESC);
