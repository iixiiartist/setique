-- Verify actual table schemas before deletion
-- Run this to see what columns actually exist

-- Check profiles table
SELECT 'PROFILES COLUMNS' as check_type;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check datasets table
SELECT 'DATASETS COLUMNS' as check_type;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'datasets' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check purchases table
SELECT 'PURCHASES COLUMNS' as check_type;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'purchases' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check curation_requests table
SELECT 'CURATION_REQUESTS COLUMNS' as check_type;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'curation_requests' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check pro_curators table
SELECT 'PRO_CURATORS COLUMNS' as check_type;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pro_curators' AND table_schema = 'public'
ORDER BY ordinal_position;

-- List ALL tables in public schema
SELECT 'ALL PUBLIC TABLES' as check_type;
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
