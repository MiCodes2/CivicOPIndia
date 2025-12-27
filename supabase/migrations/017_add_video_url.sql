-- 017_add_video_url.sql
-- Add video_url column to activities table for embedded videos

ALTER TABLE activities ADD COLUMN IF NOT EXISTS video_url TEXT;