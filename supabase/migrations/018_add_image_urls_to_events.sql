-- Add image_urls column to events table for multiple image support
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_urls TEXT[];