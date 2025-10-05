-- Create Admin System
-- Run this in Supabase SQL Editor

-- 1. Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  role TEXT DEFAULT 'admin', -- admin, super_admin, moderator
  permissions TEXT[] DEFAULT ARRAY['approve_curators', 'manage_users', 'view_analytics', 'handle_support'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_role CHECK (role IN ('admin', 'super_admin', 'moderator'))
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can view all admins"
  ON admins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage admins"
  ON admins FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Grant permissions
GRANT ALL ON admins TO authenticated;

-- 2. Update pro_curators policies to allow admin read access
DROP POLICY IF EXISTS "Pro curators are viewable by everyone" ON pro_curators;

CREATE POLICY "Pro curators are viewable by admins and public if approved"
  ON pro_curators FOR SELECT
  USING (
    certification_status = 'approved' 
    OR EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

-- Allow admins to update pro curator status
CREATE POLICY "Admins can update pro curator certification status"
  ON pro_curators FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

-- 3. Add admin notification/activity log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES admins(user_id) NOT NULL,
  action_type TEXT NOT NULL, -- approve_curator, reject_curator, ban_user, etc.
  target_id UUID, -- ID of affected resource
  target_type TEXT, -- pro_curator, user, dataset, etc.
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created_at ON admin_activity_log(created_at DESC);

ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity log"
  ON admin_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create activity log entries"
  ON admin_activity_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
    AND admin_id = auth.uid()
  );

GRANT ALL ON admin_activity_log TO authenticated;

-- 4. Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins WHERE user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Insert YOUR user as the first super admin
-- Replace 'YOUR_USER_ID' with your actual Supabase user ID
-- You can get your user ID by running: SELECT auth.uid();

-- IMPORTANT: Run this query first to get your user ID:
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then uncomment and run this with your actual user ID:
-- INSERT INTO admins (user_id, role, permissions)
-- VALUES (
--   'YOUR_USER_ID_HERE',
--   'super_admin',
--   ARRAY['approve_curators', 'manage_users', 'manage_admins', 'view_analytics', 'handle_support', 'manage_datasets', 'manage_bounties']
-- );

-- Verify setup
SELECT 'Admin system created successfully! Now add your user ID as super_admin.' as message;
