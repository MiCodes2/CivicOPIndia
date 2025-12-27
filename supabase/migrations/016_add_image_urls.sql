-- Add image_urls and image_captions columns to activities table for multiple image support
ALTER TABLE activities ADD COLUMN IF NOT EXISTS image_urls TEXT[];
ALTER TABLE activities ADD COLUMN IF NOT EXISTS image_captions TEXT[];