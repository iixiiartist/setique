-- Diagnostic: Check if Pro Curator tables exist
-- Run this in Supabase SQL Editor first

SELECT 
  table_name,
  'EXISTS' as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'pro_curators',
  'curation_requests', 
  'curator_proposals',
  'dataset_partnerships'
)
ORDER BY table_name;

-- If this returns 0 rows, you need to run migration 008 first!
