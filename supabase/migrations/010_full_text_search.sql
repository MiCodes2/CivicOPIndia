-- Add a tsvector column, trigger to keep it updated, a GIN index, and a helper RPC for searching
ALTER TABLE IF EXISTS activities
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Populate existing rows
UPDATE activities SET search_vector = to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content,''));

-- Trigger function to update vector
CREATE OR REPLACE FUNCTION activities_search_vector_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple', coalesce(NEW.title,'') || ' ' || coalesce(NEW.content,''));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_activities_search_vector ON activities;
CREATE TRIGGER update_activities_search_vector
  BEFORE INSERT OR UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION activities_search_vector_trigger();

-- GIN index
CREATE INDEX IF NOT EXISTS activities_search_vector_idx ON activities USING GIN(search_vector);

-- Simple RPC to search activities using plainto_tsquery and ranking
CREATE OR REPLACE FUNCTION search_activities(query_text text, limit_rows int DEFAULT 100)
RETURNS SETOF activities
AS $$
BEGIN
  RETURN QUERY
  SELECT a.*
  FROM activities a
  WHERE a.search_vector @@ plainto_tsquery('simple', query_text)
  ORDER BY ts_rank_cd(a.search_vector, plainto_tsquery('simple', query_text)) DESC
  LIMIT limit_rows;
END;
$$ LANGUAGE plpgsql STABLE;
