-- Check if the handle_new_user function has issues with the username field

-- First, let's see the actual function definition
SELECT 'HANDLE_NEW_USER FUNCTION' as check_type;
SELECT routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';

-- The function uses: new.raw_user_meta_data->>'username'
-- This might be NULL or missing during signup!

-- Let's create a safer version that handles missing username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log for debugging
  RAISE LOG 'Creating profile for user: % with email: %', NEW.id, NEW.email;
  
  -- Insert profile with proper NULL handling for username
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'username', NULL)
  );
  
  RAISE LOG 'Profile created successfully for user: %', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    RAISE LOG 'ERROR in handle_new_user for user %: % %', NEW.id, SQLERRM, SQLSTATE;
    -- Re-raise to fail the signup (so we know there's an issue)
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- Verify the function was updated
SELECT 'Function updated with error handling' as status;

-- Now let's also make create_beta_access_on_signup more robust
CREATE OR REPLACE FUNCTION create_beta_access_on_signup()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log for debugging
  RAISE LOG 'Creating beta_access for user: % with email: %', NEW.id, NEW.email;
  
  -- Insert into beta_access
  INSERT INTO beta_access (user_id, email, access_code)
  VALUES (
    NEW.id,
    NEW.email,
    generate_access_code()
  );
  
  RAISE LOG 'Beta access created successfully for user: %', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    RAISE LOG 'ERROR in create_beta_access_on_signup for user %: % %', NEW.id, SQLERRM, SQLSTATE;
    -- Re-raise to fail the signup
    RAISE;
END;
$$ LANGUAGE plpgsql;

SELECT 'Both trigger functions updated with error handling and logging' as status;
SELECT 'Try signup now - check Database Logs for detailed error messages' as instruction;
