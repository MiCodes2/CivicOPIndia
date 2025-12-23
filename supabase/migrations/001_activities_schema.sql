-- Activities table with enhanced features for social feed
CREATE TABLE IF NOT EXISTS activities (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activity_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title TEXT NOT NULL,
  content TEXT,
  location TEXT,
  image_url TEXT,
  author_id UUID REFERENCES auth.users(id),
  tags TEXT[],
  likes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  type TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Allow public to read activities
CREATE POLICY "Activities are viewable by everyone"
  ON activities FOR SELECT
  USING (true);

-- Only authenticated users can insert/update/delete
CREATE POLICY "Authenticated users can insert activities"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own activities"
  ON activities FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own activities"
  ON activities FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Create index for better query performance
CREATE INDEX activities_activity_date_idx ON activities(activity_date DESC);
CREATE INDEX activities_author_id_idx ON activities(author_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE
ON activities FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
