-- Deep dive: Check EVERYTHING about the signup flow

-- 1. Verify the System policy exists
SELECT 'SYSTEM POLICY CHECK' as check_type;
SELECT 
  policyname,
  permissive,
  cmd,
  with_check
FROM pg_policies
WHERE tablename = 'beta_access'
  AND policyname = 'System can create beta access';

-- 2. Check if there are any conflicting policies
SELECT 'ALL INSERT POLICIES' as check_type;
SELECT 
  policyname,
  permissive,
  roles,
  with_check
FROM pg_policies
WHERE tablename = 'beta_access'
  AND cmd = 'INSERT';

-- 3. Try to simulate the exact signup flow
DO $$
DECLARE
  test_user_id UUID;
  test_email TEXT := 'realtest@example.com';
  test_code TEXT;
BEGIN
  -- Generate a real UUID
  test_user_id := gen_random_uuid();
  
  RAISE NOTICE '=== TESTING SIGNUP FLOW ===';
  RAISE NOTICE 'Test user ID: %', test_user_id;
  
  -- Step 1: Try to generate access code
  BEGIN
    test_code := generate_access_code();
    RAISE NOTICE '✓ Generated access code: %', test_code;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✗ ERROR generating code: %', SQLERRM;
      RETURN;
  END;
  
  -- Step 2: Try to insert into beta_access directly (simulating trigger)
  BEGIN
    INSERT INTO beta_access (user_id, email, access_code)
    VALUES (test_user_id, test_email, test_code);
    
    RAISE NOTICE '✓ Successfully inserted into beta_access';
    
    -- Verify it was inserted
    IF EXISTS (SELECT 1 FROM beta_access WHERE user_id = test_user_id) THEN
      RAISE NOTICE '✓ Record exists in beta_access';
      
      -- Show the record
      RAISE NOTICE 'Record details: %', (
        SELECT row_to_json(b) FROM beta_access b WHERE user_id = test_user_id
      );
    ELSE
      RAISE NOTICE '✗ ERROR: Record not found after insert';
    END IF;
    
    -- Clean up
    DELETE FROM beta_access WHERE user_id = test_user_id;
    RAISE NOTICE '✓ Test cleanup complete';
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✗ ERROR inserting into beta_access: %', SQLERRM;
      RAISE NOTICE '   Error code: %', SQLSTATE;
      RAISE NOTICE '   Error detail: %', SQLERRM;
      
      -- Try to clean up anyway
      BEGIN
        DELETE FROM beta_access WHERE user_id = test_user_id;
      EXCEPTION
        WHEN OTHERS THEN NULL;
      END;
  END;
  
END $$;

-- 4. Check if there's an issue with the handle_new_user function
SELECT 'HANDLE_NEW_USER FUNCTION' as check_type;
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';

-- 5. Check the order of triggers (they execute in alphabetical order!)
SELECT 'TRIGGER EXECUTION ORDER' as check_type;
SELECT 
  trigger_name,
  action_order,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
  AND event_object_schema = 'public'
ORDER BY action_order;

-- 6. Check for errors in PostgreSQL logs (if accessible)
SELECT 'CHECK LOGS' as check_type;
SELECT 'Run this in Supabase Dashboard -> Database -> Logs to see actual errors' as instruction;
