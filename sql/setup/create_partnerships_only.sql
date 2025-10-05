-- Create ONLY dataset_partnerships table (if it's missing)

CREATE TABLE IF NOT EXISTS dataset_partnerships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE NOT NULL UNIQUE,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  curator_id UUID REFERENCES pro_curators(id) NOT NULL,
  curator_user_id UUID REFERENCES auth.users(id) NOT NULL,
  split_percentage DECIMAL(5,2) DEFAULT 50.00,
  agreement_terms TEXT,
  status TEXT DEFAULT 'active',
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
CREATE INDEX IF NOT EXISTS idx_dataset_partnerships_dataset ON dataset_partnerships(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_partnerships_owner ON dataset_partnerships(owner_id);
CREATE INDEX IF NOT EXISTS idx_dataset_partnerships_curator ON dataset_partnerships(curator_id);
CREATE INDEX IF NOT EXISTS idx_dataset_partnerships_curator_user ON dataset_partnerships(curator_user_id);
CREATE INDEX IF NOT EXISTS idx_dataset_partnerships_status ON dataset_partnerships(status);

-- Enable RLS
ALTER TABLE dataset_partnerships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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
