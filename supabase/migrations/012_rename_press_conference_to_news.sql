-- Migration: rename 'Press Conference' activity types to 'News'
-- Run this in Supabase SQL editor or via supabase CLI.

BEGIN;

-- 1) Update activities rows
UPDATE public.activities
SET type = 'News'
WHERE LOWER(type) IN ('press conference', 'press conferences', 'pressconference', 'press-conference');

-- 2) Update canonical activity_types table entries (if present)
UPDATE public.activity_types
SET name = 'News'
WHERE LOWER(name) IN ('press conference', 'press conferences', 'pressconference', 'press-conference');

-- 3) Ensure a 'News' row exists in activity_types
INSERT INTO public.activity_types (name)
SELECT 'News'
WHERE NOT EXISTS (SELECT 1 FROM public.activity_types WHERE LOWER(name) = 'news');

COMMIT;

-- NOTE: This migration only renames textual labels. If you use any caches or external indices,
-- reindex or clear caches as needed. Backup your DB or run inside a transaction (above) first.
