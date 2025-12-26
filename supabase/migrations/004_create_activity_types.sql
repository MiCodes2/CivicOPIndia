-- Create activity_types lookup table and seed canonical types

CREATE TABLE IF NOT EXISTS public.activity_types (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed canonical types
INSERT INTO public.activity_types (name) VALUES
('Meetings'),
('Campaigns'),
('Protests'),
('Drive'),
('Plantation'),
('Other'),
('News')
ON CONFLICT (name) DO NOTHING;
