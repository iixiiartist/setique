-- Debug curation_requests insert issue
-- Run this to see what might be blocking the insert

-- 1. Check RLS is enabled and policies exist
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'curation_requests';

-- 2. List all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'curation_requests';

-- 3. Check table structure matches what code expects
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'curation_requests'
ORDER BY ordinal_position;

-- 4. Check if there are any triggers or constraints
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'curation_requests';

-- 5. Try a test insert (replace YOUR_USER_ID with actual UUID)
-- This will show the exact error
/*
INSERT INTO curation_requests (
  creator_id,
  title,
  description,
  target_quality,
  budget_min,
  budget_max,
  specialties_needed,
  status
) VALUES (
  'YOUR_USER_ID_HERE',
  'Test Request',
  'Test description',
  'advanced',
  100.00,
  500.00,
  ARRAY['image_labeling'],
  'open'
);
*/
