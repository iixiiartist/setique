-- Check the valid_target_quality constraint
-- Run this in Supabase SQL Editor to see what values are allowed

SELECT 
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'curation_requests'
  AND con.conname = 'valid_target_quality';

-- Also check the column definition
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'curation_requests'
  AND column_name = 'target_quality';
