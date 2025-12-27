-- Add views_count column to activities
ALTER TABLE IF EXISTS activities
ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0;

-- Add an index to speed up queries by type (optional)
CREATE INDEX IF NOT EXISTS idx_activities_views_count ON activities (views_count);