-- 005_add_full_text_search.sql
-- Adds full-text search vector, indexes, and helper functions for activities

-- Ensure extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add a stored tsvector column for activities (title, content, tags)
ALTER TABLE IF EXISTS activities
  ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'C')
  ) STORED;

-- Create GIN index on the tsvector
CREATE INDEX IF NOT EXISTS idx_activities_search_vector ON activities USING GIN (search_vector);

-- Create trigram index for title autocomplete
CREATE INDEX IF NOT EXISTS idx_activities_title_trgm ON activities USING gin (lower(title) gin_trgm_ops);

-- Helper: search activities with ranking, filtering, pagination
CREATE OR REPLACE FUNCTION public.search_activities(
  in_query text,
  in_type text DEFAULT NULL,
  in_tag text DEFAULT NULL,
  in_limit int DEFAULT 10,
  in_offset int DEFAULT 0
)
RETURNS SETOF activities
LANGUAGE sql STABLE AS $$
  SELECT a.*
  FROM activities a
  WHERE
    (in_type IS NULL OR in_type = '' OR a.type = in_type)
    AND (
      in_tag IS NULL OR in_tag = ''
      OR ( (a.tags IS NOT NULL AND array_to_string(a.tags, ' ') ILIKE '%' || in_tag || '%')
           OR (exists (select 1 from unnest(a.tags) t where lower(t) = lower(in_tag)))
      )
    )
    AND (
      in_query IS NULL OR in_query = ''
      OR (a.search_vector @@ websearch_to_tsquery('english', in_query))
    )
  ORDER BY
    CASE WHEN in_query IS NULL OR in_query = '' THEN a.activity_date END DESC,
    ts_rank_cd(a.search_vector, COALESCE(NULLIF(websearch_to_tsquery('english', in_query), ''), to_tsquery('')) ) DESC NULLS LAST,
    a.activity_date DESC
  LIMIT in_limit OFFSET in_offset;
$$;

-- Count helper
CREATE OR REPLACE FUNCTION public.search_activities_count(
  in_query text,
  in_type text DEFAULT NULL,
  in_tag text DEFAULT NULL
) RETURNS integer
LANGUAGE sql STABLE AS $$
  SELECT count(*) FROM activities a
  WHERE
    (in_type IS NULL OR in_type = '' OR a.type = in_type)
    AND (
      in_tag IS NULL OR in_tag = ''
      OR ( (a.tags IS NOT NULL AND array_to_string(a.tags, ' ') ILIKE '%' || in_tag || '%')
           OR (exists (select 1 from unnest(a.tags) t where lower(t) = lower(in_tag)))
      )
    )
    AND (
      in_query IS NULL OR in_query = ''
      OR (a.search_vector @@ websearch_to_tsquery('english', in_query))
    );
$$;

-- Suggest helper for autocomplete (title prefix + tags)
CREATE OR REPLACE FUNCTION public.suggest_activities(
  in_prefix text,
  in_limit int DEFAULT 8
) RETURNS TABLE(id uuid, title text, excerpt text)
LANGUAGE sql STABLE AS $$
  SELECT a.id, a.title, left(a.content, 240) as excerpt
  FROM activities a
  WHERE (in_prefix IS NULL OR in_prefix = '' OR lower(a.title) LIKE lower(in_prefix) || '%')
  ORDER BY a.activity_date DESC
  LIMIT in_limit;
$$;
