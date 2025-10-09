-- Fix: Update the trigger function to bypass RLS
-- The issue is likely that the trigger function is being blocked by RLS policies

-- Drop and recreate the function with proper security settings
CREATE OR REPLACE FUNCTION create_beta_access_on_signup()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use a BEGIN/EXCEPTION block to catch and log errors
  BEGIN
    -- Insert into beta_access with proper error handling
    INSERT INTO beta_access (user_id, email, access_code)
    VALUES (
      NEW.id,
      NEW.email,
      generate_access_code()
    );
    
    RAISE LOG 'Beta access created for user: %', NEW.id;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the whole signup
      RAISE LOG 'Failed to create beta_access for user %: % %', NEW.id, SQLERRM, SQLSTATE;
      -- Re-raise the exception so signup fails (we want to know about this)
      RAISE;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify the function was updated
SELECT 'Function updated successfully' as status;

-- Test it by checking the function definition
SELECT 
  routine_name,
  security_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'create_beta_access_on_signup'
  AND routine_schema = 'public';
