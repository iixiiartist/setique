-- Simulate EXACT signup flow to find the error
-- This will show us the exact error message

DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_email TEXT := 'debugtest@example.com';
  test_username TEXT := 'debugtestuser';
BEGIN
  RAISE NOTICE '=== SIMULATING SIGNUP FLOW ===';
  RAISE NOTICE 'Test user ID: %', test_user_id;
  RAISE NOTICE 'Test email: %', test_email;
  RAISE NOTICE 'Test username: %', test_username;
  RAISE NOTICE '';
  
  -- Step 1: Insert into auth.users (simulated - we can't actually do this)
  RAISE NOTICE 'Step 1: auth.users record would be created here';
  RAISE NOTICE '';
  
  -- Step 2: Simulate the handle_new_user() trigger
  RAISE NOTICE 'Step 2: Attempting to insert profile...';
  BEGIN
    INSERT INTO profiles (id, email, username)
    VALUES (test_user_id, test_email, test_username);
    
    RAISE NOTICE '✓ SUCCESS: Profile inserted';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✗ FAILED: Profile insert error';
      RAISE NOTICE '   Error: %', SQLERRM;
      RAISE NOTICE '   SQL State: %', SQLSTATE;
      RAISE NOTICE '   This is why signup is failing!';
      
      -- Clean up and exit
      ROLLBACK;
      RETURN;
  END;
  
  -- Step 3: Check if profile exists
  IF EXISTS (SELECT 1 FROM profiles WHERE id = test_user_id) THEN
    RAISE NOTICE '✓ Profile exists in database';
  ELSE
    RAISE NOTICE '✗ Profile NOT found (shouldn''t happen)';
  END IF;
  RAISE NOTICE '';
  
  -- Step 4: Simulate the trigger_create_beta_access trigger
  RAISE NOTICE 'Step 3: Attempting to insert beta_access...';
  BEGIN
    INSERT INTO beta_access (user_id, email, access_code)
    VALUES (test_user_id, test_email, generate_access_code());
    
    RAISE NOTICE '✓ SUCCESS: Beta access inserted';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✗ FAILED: Beta access insert error';
      RAISE NOTICE '   Error: %', SQLERRM;
      RAISE NOTICE '   SQL State: %', SQLSTATE;
      
      -- Clean up
      DELETE FROM profiles WHERE id = test_user_id;
      ROLLBACK;
      RETURN;
  END;
  
  -- Step 5: Verify beta_access exists
  IF EXISTS (SELECT 1 FROM beta_access WHERE user_id = test_user_id) THEN
    RAISE NOTICE '✓ Beta access exists in database';
    
    -- Show the record
    DECLARE
      beta_record RECORD;
    BEGIN
      SELECT * INTO beta_record FROM beta_access WHERE user_id = test_user_id;
      RAISE NOTICE '   Status: %', beta_record.status;
      RAISE NOTICE '   Access code: %', beta_record.access_code;
    END;
  ELSE
    RAISE NOTICE '✗ Beta access NOT found (shouldn''t happen)';
  END IF;
  RAISE NOTICE '';
  
  -- Clean up test data
  RAISE NOTICE 'Cleaning up test data...';
  DELETE FROM beta_access WHERE user_id = test_user_id;
  DELETE FROM profiles WHERE user_id = test_user_id;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST COMPLETE ===';
  RAISE NOTICE 'If you see all ✓ marks above, the signup should work!';
  RAISE NOTICE 'If you see ✗ marks, that''s where the 500 error is coming from.';
  
END $$;
