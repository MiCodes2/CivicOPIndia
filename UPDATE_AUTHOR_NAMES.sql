-- Add author_name column to activities table if it doesn't exist
ALTER TABLE activities ADD COLUMN IF NOT EXISTS author_name TEXT;

-- Add author_name column to events table if it doesn't exist
ALTER TABLE events ADD COLUMN IF NOT EXISTS author_name TEXT;

-- Update NULL or 'Unknown' author names in activities table to 'Civic Admin'
UPDATE activities 
SET author_name = 'Civic Admin' 
WHERE author_name IS NULL OR author_name = 'Unknown' OR author_name = 'Admin';

-- Update NULL or 'Unknown' author names in events table to 'Civic Admin'
UPDATE events 
SET author_name = 'Civic Admin' 
WHERE author_name IS NULL OR author_name = 'Unknown' OR author_name = 'Admin';

-- Display results
SELECT 'Activities updated:', COUNT(*) FROM activities WHERE author_name = 'Civic Admin';
SELECT 'Events updated:', COUNT(*) FROM events WHERE author_name = 'Civic Admin';
