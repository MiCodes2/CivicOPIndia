-- Add pinned and highlight columns to activities table
-- pinned: Pin posts to the top of the feed (like X/Twitter)
-- highlight: Visually highlight important posts

ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_highlighted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;

-- Create index for pinned posts for better query performance
CREATE INDEX IF NOT EXISTS activities_pinned_idx ON activities(is_pinned DESC, pinned_at DESC) WHERE is_pinned = TRUE;

-- Update the existing activities ordering to prioritize pinned posts
-- This index helps with queries that order by pinned status first, then by date
CREATE INDEX IF NOT EXISTS activities_pinned_date_idx ON activities(is_pinned DESC, activity_date DESC);

COMMENT ON COLUMN activities.is_pinned IS 'Pin this post to the top of the feed';
COMMENT ON COLUMN activities.is_highlighted IS 'Highlight this post with special styling';
COMMENT ON COLUMN activities.pinned_at IS 'Timestamp when the post was pinned';
