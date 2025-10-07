-- Check which tables have user_id column
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('user_id', 'creator_id', 'buyer_id')
ORDER BY table_name, column_name;

-- Check specific tables mentioned in migration
SELECT 'deletion_requests' as table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'deletion_requests'
  AND column_name LIKE '%user%'

UNION ALL

SELECT 'pro_curators' as table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'pro_curators'
  AND column_name LIKE '%user%'

UNION ALL

SELECT 'downloads' as table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'downloads'
  AND column_name LIKE '%user%';
