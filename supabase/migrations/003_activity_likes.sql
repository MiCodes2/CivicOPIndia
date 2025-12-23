-- Create likes tracking table
CREATE TABLE IF NOT EXISTS activity_likes (
  id BIGSERIAL PRIMARY KEY,
  activity_id BIGINT REFERENCES activities(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_id, ip_address)
);

-- Enable RLS
ALTER TABLE activity_likes ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read likes
CREATE POLICY "Likes are viewable by everyone"
  ON activity_likes FOR SELECT
  USING (true);

-- Allow everyone to insert likes (we'll check uniqueness in app)
CREATE POLICY "Anyone can like activities"
  ON activity_likes FOR INSERT
  WITH CHECK (true);

-- Index for performance
CREATE INDEX activity_likes_activity_id_idx ON activity_likes(activity_id);
CREATE INDEX activity_likes_ip_address_idx ON activity_likes(ip_address);
