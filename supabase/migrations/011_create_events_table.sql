-- Create events table for standard events (protest, tree plantation, etc.)
-- Run this migration using your supabase migration tooling or psql

CREATE TABLE IF NOT EXISTS public.events (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  event_date timestamptz NOT NULL,
  title text NOT NULL,
  content text,
  location text,
  image_url text,
  type text,
  tags text[] DEFAULT ARRAY['event']::text[],
  author_id uuid,
  author_name text,
  published boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS events_event_date_idx ON public.events (event_date);
CREATE INDEX IF NOT EXISTS events_tags_idx ON public.events USING GIN (tags);
