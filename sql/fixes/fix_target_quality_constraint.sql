-- Fix the valid_target_quality constraint
-- The frontend sends: 'basic', 'standard', 'premium'
-- We need to update the constraint to accept these values

-- Step 1: Check current constraint
SELECT 
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'curation_requests'
  AND con.conname = 'valid_target_quality';

-- Step 2: Drop the old constraint
ALTER TABLE curation_requests DROP CONSTRAINT IF EXISTS valid_target_quality;

-- Step 3: Add the correct constraint that matches the frontend values
ALTER TABLE curation_requests 
ADD CONSTRAINT valid_target_quality 
CHECK (target_quality IN ('basic', 'standard', 'premium'));

-- Step 4: Verify the fix
SELECT 
  'Constraint updated!' as status,
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'curation_requests'
  AND con.conname = 'valid_target_quality';
