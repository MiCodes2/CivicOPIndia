-- Update image URLs in activities table replacing .jfif with .jpg
UPDATE activities
SET image_url = regexp_replace(image_url, '\\.jfif$', '.jpg')
WHERE image_url LIKE '%\\.jfif';
