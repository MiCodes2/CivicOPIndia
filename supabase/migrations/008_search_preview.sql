-- 008_search_preview.sql
-- Adds a preview search function that accepts custom weights for ranking

CREATE OR REPLACE FUNCTION public.search_preview(
  in_query text,
  w_rank float DEFAULT 0.8,
  w_tag float DEFAULT 0.3,
  w_title float DEFAULT 0.5,
  in_limit int DEFAULT 10
)
RETURNS SETOF activities
LANGUAGE sql STABLE AS $$
  SELECT a.*
  FROM activities a
  WHERE (
    in_query IS NULL OR in_query = ''
    OR (a.search_vector @@ websearch_to_tsquery('english', public.apply_search_synonyms(in_query)))
  )
  ORDER BY (
    COALESCE(ts_rank_cd(a.search_vector, websearch_to_tsquery('english', public.apply_search_synonyms(in_query))), 0) * w_rank
    + (CASE WHEN a.tags IS NOT NULL AND array_to_string(a.tags, ' ') ILIKE '%' || in_query || '%' THEN w_tag ELSE 0 END)
    + (CASE WHEN a.title ILIKE '%' || in_query || '%' THEN w_title ELSE 0 END)
  ) DESC, a.activity_date DESC
  LIMIT in_limit;
$$;
