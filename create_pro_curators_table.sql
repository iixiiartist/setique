-- Quick fix: Create pro_curators table if it doesn't exist
-- Run this in Supabase SQL Editor

-- Create the table
CREATE TABLE IF NOT EXISTS pro_curators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  specialties TEXT[] DEFAULT '{}',
  portfolio_samples TEXT[] DEFAULT '{}',
  hourly_rate DECIMAL(10,2),
  certification_status TEXT DEFAULT 'pending',
  badge_level TEXT DEFAULT 'verified',
  portfolio_datasets UUID[] DEFAULT '{}',
  rating DECIMAL(3,2) DEFAULT 0,
  total_projects INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_certification_status CHECK (certification_status IN ('pending', 'approved', 'suspended', 'rejected')),
  CONSTRAINT valid_badge_level CHECK (badge_level IN ('verified', 'expert', 'master')),
  CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pro_curators_user_id ON pro_curators(user_id);
CREATE INDEX IF NOT EXISTS idx_pro_curators_status ON pro_curators(certification_status);
CREATE INDEX IF NOT EXISTS idx_pro_curators_specialties ON pro_curators USING GIN(specialties);

-- Enable RLS
ALTER TABLE pro_curators ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Pro curators are viewable by everyone" ON pro_curators;
DROP POLICY IF EXISTS "Users can create their own pro curator profile" ON pro_curators;
DROP POLICY IF EXISTS "Users can update their own pro curator profile" ON pro_curators;

-- Create RLS policies
CREATE POLICY "Pro curators are viewable by everyone"
  ON pro_curators FOR SELECT
  USING (certification_status = 'approved');

CREATE POLICY "Users can create their own pro curator profile"
  ON pro_curators FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pro curator profile"
  ON pro_curators FOR UPDATE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON pro_curators TO authenticated;
GRANT SELECT ON pro_curators TO anon;

-- Verify the table was created
SELECT 'pro_curators table created successfully!' as message;
