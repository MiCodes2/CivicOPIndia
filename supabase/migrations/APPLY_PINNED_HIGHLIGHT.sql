-- Quick SQL script to add pinned/highlight features
-- Run this in Supabase SQL Editor or via migration

-- Add columns
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_highlighted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;

-- Create indexes
CREATE INDEX IF NOT EXISTS activities_pinned_idx ON activities(is_pinned DESC, pinned_at DESC) WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS activities_pinned_date_idx ON activities(is_pinned DESC, activity_date DESC);

-- Verify
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'activities' 
AND column_name IN ('is_pinned', 'is_highlighted', 'pinned_at');
