-- Check if is_featured column exists and its default value
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'datasets' 
  AND column_name LIKE '%featured%'
ORDER BY ordinal_position;

-- Also check all datasets to see their is_featured status
SELECT 
  id,
  title,
  creator_id,
  is_featured,
  created_at
FROM datasets
ORDER BY created_at DESC
LIMIT 10;
