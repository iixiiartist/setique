-- Update existing sample datasets to add (DEMO) prefix
UPDATE datasets
SET title = '(DEMO) ' || title
WHERE title IN (
  'A Photographic Archive of Brutalist Architecture in Pittsburgh',
  'Audio Library of Antique Mechanical Keyboards',
  'A Lexicon of 1980s Skateboarder Slang',
  '50k Urban Street-Sign Images (COCO-annotated)',
  'Encyclopedia of North American Diner Pancakes',
  '8k Household Actions (Video Clips, 1080p)'
)
AND title NOT LIKE '(DEMO)%'; -- Don't double-prefix if already has DEMO

-- Update existing sample bounties to add (DEMO) prefix
UPDATE bounties
SET title = '(DEMO) ' || title
WHERE title IN (
  'Recordings of Different Types of Rain',
  'Positive Customer Support Chat Logs'
)
AND title NOT LIKE '(DEMO)%'; -- Don't double-prefix if already has DEMO
