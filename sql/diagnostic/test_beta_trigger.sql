-- Test the beta access trigger manually
-- This will help us see the exact error that's occurring during signup

-- First, let's try to manually insert a test profile to trigger the beta access creation
-- We'll use a fake UUID that doesn't exist in auth.users to safely test

BEGIN;

-- Create a temporary test entry
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000001';
  test_email TEXT := 'test@example.com';
BEGIN
  -- Clean up any existing test data
  DELETE FROM beta_access WHERE user_id = test_user_id;
  DELETE FROM profiles WHERE id = test_user_id;
  
  -- Try to insert a test profile (this should trigger beta_access creation)
  BEGIN
    INSERT INTO profiles (id, email, username)
    VALUES (test_user_id, test_email, 'testuser123');
    
    RAISE NOTICE 'Profile inserted successfully';
    
    -- Check if beta_access was created
    IF EXISTS (SELECT 1 FROM beta_access WHERE user_id = test_user_id) THEN
      RAISE NOTICE 'Beta access record created successfully!';
      
      -- Show the created record
      RAISE NOTICE 'Beta access details: %', (
        SELECT row_to_json(b) 
        FROM beta_access b 
        WHERE user_id = test_user_id
      );
    ELSE
      RAISE NOTICE 'ERROR: Beta access record was NOT created';
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'ERROR during profile insert: %', SQLERRM;
      RAISE NOTICE 'Error detail: %', SQLSTATE;
  END;
  
  -- Clean up test data
  DELETE FROM beta_access WHERE user_id = test_user_id;
  DELETE FROM profiles WHERE id = test_user_id;
  
  RAISE NOTICE 'Test completed and cleaned up';
END $$;

ROLLBACK;

-- Also check if there are any constraint violations
SELECT 
  'CONSTRAINT CHECK' as check_type,
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'beta_access'::regclass
ORDER BY contype, conname;
