-- Check the actual status constraint on curation_requests table

-- Method 1: Check constraint definition
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'curation_requests'::regclass
AND conname LIKE '%status%';

-- Method 2: Check column definition
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'curation_requests'
AND column_name = 'status';

-- Method 3: Try to see all constraints on the table
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'curation_requests'::regclass
ORDER BY conname;
