-- Add initial_views_count to activities
BEGIN;

ALTER TABLE IF EXISTS public.activities
  ADD COLUMN IF NOT EXISTS initial_views_count integer NOT NULL DEFAULT 0;

-- Backfill existing rows: set initial_views_count to current views_count where it is zero
UPDATE public.activities
  SET initial_views_count = COALESCE(views_count, 0)
  WHERE initial_views_count IS NULL OR initial_views_count = 0;

COMMIT;