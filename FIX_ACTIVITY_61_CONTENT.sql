-- ============================================
-- FIX ACTIVITY 61 CORRUPTED CONTENT - AGGRESSIVE CLEANUP
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- First, check the current content
SELECT id, title, content 
FROM activities 
WHERE id = 61;

-- AGGRESSIVE FIX: Strip ALL HTML tags and keep only text
-- This will remove all corrupted HTML but preserve the text content
UPDATE activities
SET content = REGEXP_REPLACE(
  REGEXP_REPLACE(content, '<[^>]+>', ' ', 'g'),
  '\s+', ' ', 'g'
)
WHERE id = 61;

-- OR: Completely replace with clean plain text (uncomment and modify if needed)
/*
UPDATE activities
SET content = 'Mithilesh Kumar joined The Mojo Story to discuss his recent participation in an online debate on job reservation policies organized by CivicOp.

#civicopposition #themojostory #jobreservation #policy #mithileshkumar'
WHERE id = 61;
*/

-- Verify the fix
SELECT id, title, content 
FROM activities 
WHERE id = 61;

-- ============================================
-- After running, hard refresh browser (Ctrl+Shift+R)
-- Then you can edit the activity in admin panel to add back proper formatting
-- ============================================
