-- Complete Beta Access System Reset and Reinstall
-- Run this if the partial migration is causing issues
-- This will cleanly remove everything and reinstall fresh

BEGIN;

-- 1. DROP ALL TRIGGERS FIRST (before functions)
DROP TRIGGER IF EXISTS trigger_create_beta_access ON profiles;
DROP TRIGGER IF EXISTS beta_access_updated_at ON beta_access;

-- 2. DROP ALL POLICIES
DROP POLICY IF EXISTS "Users can view own beta access" ON beta_access;
DROP POLICY IF EXISTS "Users can update own beta access" ON beta_access;
DROP POLICY IF EXISTS "Admins can view all beta access" ON beta_access;
DROP POLICY IF EXISTS "Admins can update beta access" ON beta_access;
DROP POLICY IF EXISTS "Admins can create beta access" ON beta_access;

-- 3. DROP THE TABLE (this will cascade and remove indexes)
DROP TABLE IF EXISTS beta_access CASCADE;

-- 4. DROP ALL FUNCTIONS
DROP FUNCTION IF EXISTS generate_access_code() CASCADE;
DROP FUNCTION IF EXISTS create_beta_access_on_signup() CASCADE;
DROP FUNCTION IF EXISTS has_beta_access(UUID) CASCADE;
DROP FUNCTION IF EXISTS admin_approve_beta_user(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS admin_reject_beta_user(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS redeem_access_code(TEXT) CASCADE;
DROP FUNCTION IF EXISTS update_beta_access_updated_at() CASCADE;

-- 5. NOW CREATE EVERYTHING FRESH

-- Create beta_access table
CREATE TABLE beta_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected', 'waitlist')),
  access_code TEXT UNIQUE NOT NULL,
  priority INTEGER DEFAULT 0,
  
  -- Admin actions
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  
  -- Tracking
  signup_source TEXT,
  code_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_beta_access_user_id ON beta_access(user_id);
CREATE INDEX idx_beta_access_status ON beta_access(status);
CREATE INDEX idx_beta_access_access_code ON beta_access(access_code);
CREATE INDEX idx_beta_access_created_at ON beta_access(created_at DESC);
CREATE INDEX idx_beta_access_priority ON beta_access(priority DESC) WHERE status = 'pending_approval';

-- Enable RLS
ALTER TABLE beta_access ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own beta access"
  ON beta_access FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own beta access"
  ON beta_access FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all beta access"
  ON beta_access FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update beta access"
  ON beta_access FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create beta access"
  ON beta_access FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
    )
  );

-- System/trigger can insert beta access records (for automatic signup creation)
CREATE POLICY "System can create beta access"
  ON beta_access FOR INSERT
  WITH CHECK (true);

-- Function to generate unique access code
CREATE FUNCTION generate_access_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    code := 'BETA-' || 
            upper(substring(md5(random()::text) from 1 for 4)) || '-' ||
            upper(substring(md5(random()::text) from 1 for 4));
    
    SELECT EXISTS(SELECT 1 FROM beta_access WHERE access_code = code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically create beta_access record on signup
CREATE FUNCTION create_beta_access_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO beta_access (user_id, email, access_code)
  VALUES (
    NEW.id,
    NEW.email,
    generate_access_code()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create beta_access when profile is created
CREATE TRIGGER trigger_create_beta_access
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_beta_access_on_signup();

-- Function to check if user has beta access
CREATE FUNCTION has_beta_access(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM beta_access
    WHERE user_id = user_id_param 
    AND status = 'approved'
    AND code_used_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve user (admin RPC)
CREATE FUNCTION admin_approve_beta_user(
  target_user_id UUID,
  admin_note TEXT DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  admin_id UUID;
  access_record RECORD;
BEGIN
  admin_id := auth.uid();
  
  IF NOT EXISTS(SELECT 1 FROM admins WHERE user_id = admin_id) THEN
    RAISE EXCEPTION 'Only admins can approve users';
  END IF;
  
  UPDATE beta_access
  SET 
    status = 'approved',
    approved_by = admin_id,
    approved_at = NOW(),
    admin_notes = COALESCE(admin_note, admin_notes),
    updated_at = NOW()
  WHERE user_id = target_user_id
  RETURNING * INTO access_record;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Beta access record not found for user';
  END IF;
  
  RETURN json_build_object(
    'user_id', access_record.user_id,
    'email', access_record.email,
    'access_code', access_record.access_code,
    'approved_at', access_record.approved_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject user (admin RPC)
CREATE FUNCTION admin_reject_beta_user(
  target_user_id UUID,
  admin_note TEXT DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  admin_id UUID;
  access_record RECORD;
BEGIN
  admin_id := auth.uid();
  
  IF NOT EXISTS(SELECT 1 FROM admins WHERE user_id = admin_id) THEN
    RAISE EXCEPTION 'Only admins can reject users';
  END IF;
  
  UPDATE beta_access
  SET 
    status = 'rejected',
    approved_by = admin_id,
    approved_at = NOW(),
    admin_notes = COALESCE(admin_note, admin_notes),
    updated_at = NOW()
  WHERE user_id = target_user_id
  RETURNING * INTO access_record;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Beta access record not found for user';
  END IF;
  
  RETURN json_build_object(
    'user_id', access_record.user_id,
    'email', access_record.email,
    'status', 'rejected'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for user to redeem access code
CREATE FUNCTION redeem_access_code(code TEXT)
RETURNS json AS $$
DECLARE
  user_id_val UUID;
  access_record RECORD;
BEGIN
  user_id_val := auth.uid();
  
  IF user_id_val IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated to redeem access code';
  END IF;
  
  SELECT * INTO access_record
  FROM beta_access
  WHERE user_id = user_id_val
  AND access_code = code
  AND status = 'approved';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid access code or not approved yet';
  END IF;
  
  UPDATE beta_access
  SET 
    code_used_at = NOW(),
    updated_at = NOW()
  WHERE user_id = user_id_val;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Access code redeemed successfully! Welcome to SETIQUE!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE FUNCTION update_beta_access_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER beta_access_updated_at
  BEFORE UPDATE ON beta_access
  FOR EACH ROW
  EXECUTE FUNCTION update_beta_access_updated_at();

COMMIT;

-- Verification queries
SELECT 'Beta access table created' as status, COUNT(*) as record_count FROM beta_access;
SELECT 'Policies created' as status, COUNT(*) as policy_count FROM pg_policies WHERE tablename = 'beta_access';
SELECT 'Functions created' as status, COUNT(*) as function_count FROM information_schema.routines WHERE routine_name LIKE '%beta%' AND routine_schema = 'public';
