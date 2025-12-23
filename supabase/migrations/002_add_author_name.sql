-- Add author_name column to activities table if it doesn't exist
ALTER TABLE activities ADD COLUMN IF NOT EXISTS author_name TEXT;
