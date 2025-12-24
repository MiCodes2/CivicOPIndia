-- 009_search_trigram_fallback.sql
-- Adds a trigram-based fallback search function for typo-tolerant matches

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION public.search_trigram(
  in_query text,
  in_limit int DEFAULT 10,
  in_offset int DEFAULT 0
)
RETURNS SETOF activities
LANGUAGE sql STABLE AS $$
  SELECT a.*
  FROM activities a
  WHERE (
    (in_query IS NULL OR in_query = '')
    OR (
      lower(a.title) LIKE lower('%' || in_query || '%')
      OR lower(a.content) LIKE lower('%' || in_query || '%')
      OR (a.tags IS NOT NULL AND array_to_string(a.tags, ' ') ILIKE '%' || in_query || '%')
      OR similarity(lower(a.title), lower(in_query)) > 0.15
      OR similarity(lower(a.content), lower(in_query)) > 0.15
    )
  )
  ORDER BY GREATEST(
    COALESCE(similarity(lower(a.title), lower(in_query)), 0),
    COALESCE(similarity(lower(a.content), lower(in_query)), 0)
  ) DESC, a.activity_date DESC
  LIMIT in_limit OFFSET in_offset;
$$;
