-- Check what tables exist and their schemas
-- Run this in Supabase SQL Editor to see your current database structure

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check if profiles table exists and its columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check datasets table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'datasets'
ORDER BY ordinal_position;

-- Count records in key tables
SELECT 
  (SELECT COUNT(*) FROM datasets) as total_datasets,
  (SELECT COUNT(*) FROM pro_curators) as total_curators,
  (SELECT COUNT(*) FROM admins) as total_admins,
  (SELECT COUNT(*) FROM admin_activity_log) as total_admin_actions;

-- Check if we have a profiles table or if we should use auth.users
SELECT COUNT(*) as profile_count FROM profiles;
