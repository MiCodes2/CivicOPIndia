-- 006_search_facets_synonyms.sql
-- Adds support for synonyms, stopwords, and facet counting for search

-- synonyms table
CREATE TABLE IF NOT EXISTS search_synonyms (
  id serial PRIMARY KEY,
  term text NOT NULL,
  canonical text NOT NULL
);

-- Example synonyms inserts (can be managed via admin UI later)
INSERT INTO search_synonyms (term, canonical) VALUES
  ('noise', 'noise pollution') ON CONFLICT DO NOTHING,
  ('rti', 'right to information') ON CONFLICT DO NOTHING,
  ('trees', 'tree plantation') ON CONFLICT DO NOTHING;

-- Function to expand synonyms in a query by replacing terms
CREATE OR REPLACE FUNCTION public.apply_search_synonyms(in_query text)
RETURNS text LANGUAGE sql STABLE AS $$
  WITH toks AS (
    SELECT regexp_split_to_table(in_query, '\s+') AS tok
  ), mapped AS (
    SELECT t.tok,
           COALESCE(s.canonical, t.tok) AS mapped
    FROM toks t
    LEFT JOIN search_synonyms s ON lower(s.term) = lower(t.tok)
  )
  SELECT string_agg(mapped, ' ') FROM mapped;
$$;

-- Custom ranking function: compute a composite score
CREATE OR REPLACE FUNCTION public.search_score(a activities, q text)
RETURNS float LANGUAGE sql STABLE AS $$
  SELECT (
    COALESCE(ts_rank_cd(a.search_vector, websearch_to_tsquery('english', q)), 0) * 0.8
    + (CASE WHEN a.tags IS NOT NULL AND array_to_string(a.tags, ' ') ILIKE '%' || q || '%' THEN 0.3 ELSE 0 END)
    + (CASE WHEN a.title ILIKE '%' || q || '%' THEN 0.5 ELSE 0 END)
  );
$$;

-- Facets function: return counts for types and top tags given the query
CREATE OR REPLACE FUNCTION public.search_facets(in_query text, in_type text DEFAULT NULL, in_tag text DEFAULT NULL)
RETURNS JSONB LANGUAGE sql STABLE AS $$
  WITH base AS (
    SELECT * FROM activities a
    WHERE (in_type IS NULL OR in_type = '' OR a.type = in_type)
      AND (
        in_tag IS NULL OR in_tag = ''
        OR ( (a.tags IS NOT NULL AND array_to_string(a.tags, ' ') ILIKE '%' || in_tag || '%')
             OR (exists (select 1 from unnest(a.tags) t where lower(t) = lower(in_tag)))
        )
      )
      AND (
        in_query IS NULL OR in_query = ''
        OR (a.search_vector @@ websearch_to_tsquery('english', public.apply_search_synonyms(in_query)))
      )
  )
  , type_counts AS (
    SELECT COALESCE(type, 'Other') AS type, count(*) AS cnt
    FROM base
    GROUP BY COALESCE(type, 'Other')
    ORDER BY cnt DESC
    LIMIT 20
  )
  , tag_counts AS (
    SELECT lower(tag) AS tag, count(*) AS cnt FROM (
      SELECT unnest(tags::text[]) AS tag FROM base WHERE tags IS NOT NULL
    ) t GROUP BY lower(tag) ORDER BY cnt DESC LIMIT 20
  )
  SELECT jsonb_build_object('types', jsonb_agg(jsonb_build_object('type', type, 'count', cnt)), 'tags', jsonb_agg(jsonb_build_object('tag', tag, 'count', cnt)))
  FROM (SELECT * FROM type_counts) ta, (SELECT * FROM tag_counts) tb;
$$;