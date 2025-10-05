-- Diagnostic: Check what's wrong with admin setup
-- Run this to see what the issue is

-- 1. Check if admins table exists
SELECT 
  'admins table exists' as check_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'admins'
  ) AS result;

-- 2. Check if you can see the admins table
SELECT 'Can query admins table' as check_name, 
  (SELECT COUNT(*) FROM admins) as admin_count;

-- 3. Check if your user exists in auth.users
SELECT 'User exists' as check_name,
  EXISTS (
    SELECT FROM auth.users 
    WHERE id = 'a9e799b2-3213-4e14-a9e5-6f5b5b9d3a92'
  ) AS result;

-- 4. Check if you're already an admin
SELECT 'Already an admin' as check_name,
  EXISTS (
    SELECT FROM admins 
    WHERE user_id = 'a9e799b2-3213-4e14-a9e5-6f5b5b9d3a92'
  ) AS result;

-- 5. Check RLS status on admins table
SELECT 
  'RLS Status' as check_name,
  relrowsecurity as rls_enabled
FROM pg_class 
WHERE relname = 'admins';

-- 6. List all policies on admins table
SELECT 
  schemaname,
  tablename, 
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE tablename = 'admins';

-- If admins table doesn't exist, run this:
-- (Copy the entire contents of create_admin_system.sql and run it)
