-- Pro Curator System Migration
-- Enables professional dataset curation partnerships with revenue splitting

-- =====================================================
-- 1. PRO CURATORS TABLE
-- =====================================================
CREATE TABLE pro_curators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  specialties TEXT[] DEFAULT '{}', -- ["computer-vision", "nlp", "audio-processing", etc.]
  hourly_rate DECIMAL(10,2),
  certification_status TEXT DEFAULT 'pending', -- pending, approved, suspended
  badge_level TEXT DEFAULT 'verified', -- verified, expert, master
  portfolio_datasets UUID[], -- Array of dataset IDs they've curated
  rating DECIMAL(3,2) DEFAULT 0,
  total_projects INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_certification_status CHECK (certification_status IN ('pending', 'approved', 'suspended')),
  CONSTRAINT valid_badge_level CHECK (badge_level IN ('verified', 'expert', 'master')),
  CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5)
);

-- Index for looking up curators by user
CREATE INDEX idx_pro_curators_user_id ON pro_curators(user_id);
CREATE INDEX idx_pro_curators_status ON pro_curators(certification_status);
CREATE INDEX idx_pro_curators_specialties ON pro_curators USING GIN(specialties);

-- =====================================================
-- 2. CURATION REQUESTS TABLE
-- =====================================================
CREATE TABLE curation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  raw_data_description TEXT,
  target_quality TEXT DEFAULT 'advanced', -- basic, advanced, production-ready
  budget_range TEXT,
  specialties_needed TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'open', -- open, assigned, in_progress, completed, cancelled
  assigned_curator_id UUID REFERENCES pro_curators(id),
  proposal_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_target_quality CHECK (target_quality IN ('basic', 'advanced', 'production-ready')),
  CONSTRAINT valid_status CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled'))
);

-- Indexes for queries
CREATE INDEX idx_curation_requests_status ON curation_requests(status);
CREATE INDEX idx_curation_requests_requester ON curation_requests(requester_id);
CREATE INDEX idx_curation_requests_curator ON curation_requests(assigned_curator_id);
CREATE INDEX idx_curation_requests_specialties ON curation_requests USING GIN(specialties_needed);

-- =====================================================
-- 3. CURATOR PROPOSALS TABLE
-- =====================================================
CREATE TABLE curator_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES curation_requests(id) ON DELETE CASCADE NOT NULL,
  curator_id UUID REFERENCES pro_curators(id) NOT NULL,
  proposal_text TEXT NOT NULL,
  estimated_completion_days INTEGER,
  suggested_price DECIMAL(10,2), -- What they think final dataset should sell for
  portfolio_samples TEXT[], -- Links or descriptions of previous work
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_proposal_status CHECK (status IN ('pending', 'accepted', 'rejected')),
  CONSTRAINT positive_completion_days CHECK (estimated_completion_days > 0),
  CONSTRAINT positive_suggested_price CHECK (suggested_price >= 0)
);

-- Indexes
CREATE INDEX idx_curator_proposals_request ON curator_proposals(request_id);
CREATE INDEX idx_curator_proposals_curator ON curator_proposals(curator_id);
CREATE INDEX idx_curator_proposals_status ON curator_proposals(status);

-- =====================================================
-- 4. DATASET PARTNERSHIPS TABLE
-- =====================================================
CREATE TABLE dataset_partnerships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE NOT NULL UNIQUE,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  curator_id UUID REFERENCES pro_curators(id) NOT NULL,
  curator_user_id UUID REFERENCES auth.users(id) NOT NULL, -- Denormalized for easier queries
  split_percentage DECIMAL(5,2) DEFAULT 50.00, -- Curator's share (out of creator's 80%)
  agreement_terms TEXT,
  status TEXT DEFAULT 'active', -- active, completed, terminated
  total_sales INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  owner_earnings DECIMAL(10,2) DEFAULT 0,
  curator_earnings DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  CONSTRAINT valid_partnership_status CHECK (status IN ('active', 'completed', 'terminated')),
  CONSTRAINT valid_split_percentage CHECK (split_percentage >= 0 AND split_percentage <= 100)
);

-- Indexes
CREATE INDEX idx_dataset_partnerships_dataset ON dataset_partnerships(dataset_id);
CREATE INDEX idx_dataset_partnerships_owner ON dataset_partnerships(owner_id);
CREATE INDEX idx_dataset_partnerships_curator ON dataset_partnerships(curator_id);
CREATE INDEX idx_dataset_partnerships_curator_user ON dataset_partnerships(curator_user_id);
CREATE INDEX idx_dataset_partnerships_status ON dataset_partnerships(status);

-- =====================================================
-- 5. EARNINGS TRACKING (extend creator_earnings)
-- =====================================================
-- Add partnership tracking to existing creator_earnings table
ALTER TABLE creator_earnings
ADD COLUMN IF NOT EXISTS partnership_id UUID REFERENCES dataset_partnerships(id),
ADD COLUMN IF NOT EXISTS is_partnership_split BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS split_role TEXT; -- 'owner' or 'curator'

CREATE INDEX IF NOT EXISTS idx_creator_earnings_partnership ON creator_earnings(partnership_id);

-- =====================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE pro_curators ENABLE ROW LEVEL SECURITY;
ALTER TABLE curation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE curator_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataset_partnerships ENABLE ROW LEVEL SECURITY;

-- Pro Curators Policies
CREATE POLICY "Pro curators are viewable by everyone"
  ON pro_curators FOR SELECT
  USING (certification_status = 'approved');

CREATE POLICY "Users can create their own pro curator profile"
  ON pro_curators FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pro curator profile"
  ON pro_curators FOR UPDATE
  USING (auth.uid() = user_id);

-- Curation Requests Policies
CREATE POLICY "Curation requests are viewable by everyone"
  ON curation_requests FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own curation requests"
  ON curation_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Requesters can update their own requests"
  ON curation_requests FOR UPDATE
  USING (auth.uid() = requester_id);

CREATE POLICY "Requesters can delete their own requests"
  ON curation_requests FOR DELETE
  USING (auth.uid() = requester_id);

-- Curator Proposals Policies
CREATE POLICY "Proposals viewable by request owner and proposal curator"
  ON curator_proposals FOR SELECT
  USING (
    auth.uid() IN (
      SELECT requester_id FROM curation_requests WHERE id = request_id
    ) OR
    auth.uid() IN (
      SELECT user_id FROM pro_curators WHERE id = curator_id
    )
  );

CREATE POLICY "Approved curators can create proposals"
  ON curator_proposals FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM pro_curators WHERE id = curator_id AND certification_status = 'approved'
    )
  );

CREATE POLICY "Curators can update their own proposals"
  ON curator_proposals FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM pro_curators WHERE id = curator_id
    )
  );

-- Dataset Partnerships Policies
CREATE POLICY "Partnerships viewable by owner, curator, or public (via dataset)"
  ON dataset_partnerships FOR SELECT
  USING (
    auth.uid() = owner_id OR
    auth.uid() = curator_user_id OR
    status = 'active'
  );

CREATE POLICY "Partnerships can be created by request owners"
  ON dataset_partnerships FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Partnerships can be updated by owner or curator"
  ON dataset_partnerships FOR UPDATE
  USING (
    auth.uid() = owner_id OR
    auth.uid() = curator_user_id
  );

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function to update curator stats after partnership creation
CREATE OR REPLACE FUNCTION update_curator_stats_on_partnership()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment total projects for curator
  UPDATE pro_curators
  SET total_projects = total_projects + 1,
      updated_at = NOW()
  WHERE id = NEW.curator_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_curator_stats
  AFTER INSERT ON dataset_partnerships
  FOR EACH ROW
  EXECUTE FUNCTION update_curator_stats_on_partnership();

-- Function to update curator badge level based on performance
CREATE OR REPLACE FUNCTION update_curator_badge_level()
RETURNS TRIGGER AS $$
BEGIN
  -- Expert: 10+ projects, 4.5+ rating
  IF NEW.total_projects >= 10 AND NEW.rating >= 4.5 THEN
    NEW.badge_level = 'expert';
  END IF;
  
  -- Master: 50+ projects, 4.8+ rating
  IF NEW.total_projects >= 50 AND NEW.rating >= 4.8 THEN
    NEW.badge_level = 'master';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_badge_level
  BEFORE UPDATE ON pro_curators
  FOR EACH ROW
  WHEN (OLD.total_projects IS DISTINCT FROM NEW.total_projects OR OLD.rating IS DISTINCT FROM NEW.rating)
  EXECUTE FUNCTION update_curator_badge_level();

-- Function to update partnership earnings
CREATE OR REPLACE FUNCTION update_partnership_earnings()
RETURNS TRIGGER AS $$
DECLARE
  partnership RECORD;
BEGIN
  -- Check if this earning is for a partnership dataset
  SELECT * INTO partnership
  FROM dataset_partnerships
  WHERE dataset_id = NEW.dataset_id AND status = 'active';
  
  IF FOUND THEN
    -- Update partnership earnings tracking
    UPDATE dataset_partnerships
    SET total_sales = total_sales + 1,
        total_revenue = total_revenue + NEW.creator_net,
        owner_earnings = owner_earnings + (NEW.creator_net * (100 - split_percentage) / 100),
        curator_earnings = curator_earnings + (NEW.creator_net * split_percentage / 100),
        updated_at = NOW()
    WHERE id = partnership.id;
    
    -- Update curator total earnings
    UPDATE pro_curators
    SET total_earnings = total_earnings + (NEW.creator_net * partnership.split_percentage / 100),
        updated_at = NOW()
    WHERE id = partnership.curator_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_partnership_earnings
  AFTER INSERT ON creator_earnings
  FOR EACH ROW
  EXECUTE FUNCTION update_partnership_earnings();

-- =====================================================
-- 8. INITIAL DATA (Optional - for testing)
-- =====================================================

-- Add some sample specialties as reference
COMMENT ON COLUMN pro_curators.specialties IS 'Common values: computer-vision, nlp, audio-processing, time-series, data-cleaning, annotation, labeling, image-processing, text-preprocessing, data-validation';
COMMENT ON COLUMN curation_requests.specialties_needed IS 'Same values as pro_curators.specialties';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
