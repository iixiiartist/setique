-- Check which Pro Curator tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'pro_curators',
  'curation_requests', 
  'curator_proposals',
  'dataset_partnerships'
)
ORDER BY table_name;
