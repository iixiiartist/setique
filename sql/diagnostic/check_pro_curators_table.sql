-- Check if pro_curators table exists and verify structure
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'pro_curators'
) AS table_exists;

-- 2. Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'pro_curators'
ORDER BY ordinal_position;

-- 3. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'pro_curators';

-- 4. Test if you can insert (replace 'YOUR_USER_ID' with actual user ID)
-- SELECT auth.uid(); -- Get your current user ID first
-- Then run:
-- INSERT INTO pro_curators (user_id, display_name, bio, specialties, certification_status)
-- VALUES ('YOUR_USER_ID', 'Test Name', 'Test bio', ARRAY['computer-vision'], 'pending')
-- RETURNING *;

-- 5. If table doesn't exist, create it by running migration 008:
-- Look for file: supabase/migrations/008_pro_curator_system.sql
