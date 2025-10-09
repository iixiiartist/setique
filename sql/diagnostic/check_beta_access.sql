-- Check if beta_access table exists and its contents
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_name = 'beta_access';

-- Check if any data exists
SELECT COUNT(*) as record_count FROM beta_access;

-- Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'beta_access';

-- Check existing functions
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name LIKE '%beta%' 
  AND routine_schema = 'public'
ORDER BY routine_name;
