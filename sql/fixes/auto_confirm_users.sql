-- Option 1: Auto-confirm users on signup (skip email verification)
-- This is useful for beta testing where you manually approve users

-- Update existing unconfirmed users to confirmed
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Show updated users
SELECT 
  email,
  email_confirmed_at,
  confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
