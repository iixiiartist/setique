-- Add creator earnings tracking table
CREATE TABLE creator_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES profiles(id) NOT NULL,
  dataset_id UUID REFERENCES datasets(id),
  purchase_id UUID REFERENCES purchases(id),
  amount NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2) NOT NULL,
  creator_net NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'held')),
  stripe_transfer_id TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(purchase_id)
);

-- Add creator payout accounts table
CREATE TABLE creator_payout_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES profiles(id) UNIQUE NOT NULL,
  stripe_connect_account_id TEXT UNIQUE,
  account_status TEXT DEFAULT 'incomplete' CHECK (account_status IN ('incomplete', 'pending', 'active', 'rejected')),
  onboarding_completed BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  current_balance NUMERIC(10,2) DEFAULT 0,
  total_earned NUMERIC(10,2) DEFAULT 0,
  total_paid NUMERIC(10,2) DEFAULT 0,
  minimum_payout_threshold NUMERIC(10,2) DEFAULT 50.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add payout requests table
CREATE TABLE payout_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES profiles(id) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  stripe_payout_id TEXT,
  error_message TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT
);

-- Indexes for performance
CREATE INDEX idx_creator_earnings_creator ON creator_earnings(creator_id);
CREATE INDEX idx_creator_earnings_status ON creator_earnings(status);
CREATE INDEX idx_payout_accounts_creator ON creator_payout_accounts(creator_id);
CREATE INDEX idx_payout_requests_creator ON payout_requests(creator_id);
CREATE INDEX idx_payout_requests_status ON payout_requests(status);

-- Enable Row Level Security
ALTER TABLE creator_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_payout_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- Policies for creator_earnings
CREATE POLICY "Creators can view own earnings"
  ON creator_earnings FOR SELECT
  USING (auth.uid() = creator_id);

-- Policies for creator_payout_accounts
CREATE POLICY "Creators can view own payout account"
  ON creator_payout_accounts FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can update own payout account"
  ON creator_payout_accounts FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can insert own payout account"
  ON creator_payout_accounts FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Policies for payout_requests
CREATE POLICY "Creators can view own payout requests"
  ON payout_requests FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can insert own payout requests"
  ON payout_requests FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Function to calculate creator balance
CREATE OR REPLACE FUNCTION get_creator_balance(creator_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
  balance NUMERIC;
BEGIN
  SELECT COALESCE(SUM(creator_net), 0)
  INTO balance
  FROM creator_earnings
  WHERE creator_id = creator_uuid AND status = 'pending';
  
  RETURN balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update creator balance when earnings change
CREATE OR REPLACE FUNCTION update_creator_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE creator_payout_accounts
  SET 
    current_balance = get_creator_balance(NEW.creator_id),
    updated_at = NOW()
  WHERE creator_id = NEW.creator_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update balance
CREATE TRIGGER on_earnings_change
  AFTER INSERT OR UPDATE ON creator_earnings
  FOR EACH ROW
  EXECUTE FUNCTION update_creator_balance();

-- Function to update updated_at timestamp
CREATE TRIGGER update_payout_accounts_updated_at 
  BEFORE UPDATE ON creator_payout_accounts
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
