-- Comprehensive check of all tables and their foreign key relationships

-- Get all tables that reference auth.users or profiles
SELECT 
  'FOREIGN KEY DEPENDENCIES' as check_type;

SELECT 
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (ccu.table_name IN ('users', 'profiles') 
       OR tc.table_name IN ('users', 'profiles'))
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- List ALL tables in public schema
SELECT 'ALL TABLES IN DATABASE' as check_type;
SELECT 
  tablename,
  schemaname
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
