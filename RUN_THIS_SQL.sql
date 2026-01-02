-- ============================================
-- RUN THIS SQL IN YOUR SUPABASE DASHBOARD
-- ============================================
-- Go to: Supabase Dashboard > SQL Editor > New Query
-- Copy this entire file and click "Run"
-- ============================================

-- Add the new columns
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS is_highlighted BOOLEAN DEFAULT FALSE;

ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;

ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS highlighted_at TIMESTAMPTZ;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS activities_pinned_idx 
ON activities(is_pinned DESC, pinned_at DESC) 
WHERE is_pinned = TRUE;

CREATE INDEX IF NOT EXISTS activities_highlighted_idx 
ON activities(is_highlighted DESC, highlighted_at DESC) 
WHERE is_highlighted = TRUE;

CREATE INDEX IF NOT EXISTS activities_pinned_date_idx 
ON activities(is_pinned DESC, activity_date DESC);

-- Verify the columns were added (should return 4 rows)
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'activities' 
AND column_name IN ('is_pinned', 'is_highlighted', 'pinned_at', 'highlighted_at')
ORDER BY column_name;

-- ============================================
-- After running this, you should see:
-- highlighted_at | timestamp with time zone | YES | NULL
-- is_highlighted | boolean | YES | false
-- is_pinned      | boolean | YES | false  
-- pinned_at      | timestamp with time zone | YES | NULL
-- ============================================
