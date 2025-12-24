-- 007_search_stopwords.sql
-- Adds stopwords management for search

CREATE TABLE IF NOT EXISTS search_stopwords (
  id serial PRIMARY KEY,
  word text NOT NULL UNIQUE
);

-- Example:
INSERT INTO search_stopwords (word) VALUES ('the') ON CONFLICT DO NOTHING;
