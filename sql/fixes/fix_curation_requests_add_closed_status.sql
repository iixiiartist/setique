-- Fix: Add 'closed' to valid_status constraint for curation_requests

-- Step 1: Drop the existing constraint
ALTER TABLE curation_requests
DROP CONSTRAINT IF EXISTS valid_status;

-- Step 2: Recreate with 'closed' included
ALTER TABLE curation_requests
ADD CONSTRAINT valid_status 
CHECK (status IN ('open', 'assigned', 'completed', 'closed'));

-- Step 3: Verify the constraint
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'curation_requests'::regclass
AND conname = 'valid_status';

-- Step 4: Test that 'closed' is now allowed (this should succeed)
-- Uncomment to test:
-- UPDATE curation_requests SET status = 'closed' WHERE id = 'some-test-id';
