-- Check curation_requests table schema
-- Run this to see the current column names

SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'curation_requests' 
ORDER BY ordinal_position;

-- Check if we have requester_id or creator_id
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'curation_requests' AND column_name = 'requester_id') 
    THEN 'Table has requester_id (NEEDS FIX)'
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'curation_requests' AND column_name = 'creator_id') 
    THEN 'Table has creator_id (CORRECT)'
    ELSE 'Table is missing both columns (MAJOR ISSUE)'
  END as column_status;

-- Check if budget columns exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'curation_requests' AND column_name = 'budget_min') 
    THEN 'Has budget_min ✓'
    ELSE 'Missing budget_min ✗'
  END as budget_min_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'curation_requests' AND column_name = 'budget_max') 
    THEN 'Has budget_max ✓'
    ELSE 'Missing budget_max ✗'
  END as budget_max_status;
