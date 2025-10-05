-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create datasets table
CREATE TABLE datasets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  modality TEXT NOT NULL,
  accent_color TEXT DEFAULT 'bg-yellow-200',
  schema_fields TEXT[] DEFAULT '{}',
  sample_data TEXT,
  notes TEXT,
  download_url TEXT,
  file_size BIGINT,
  purchase_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchases table
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  dataset_id UUID REFERENCES datasets(id) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_session_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, dataset_id)
);

-- Create bounties table
CREATE TABLE bounties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  modality TEXT NOT NULL,
  quantity TEXT,
  file_formats TEXT,
  annotation_type TEXT,
  labels TEXT[] DEFAULT '{}',
  budget NUMERIC(10,2) NOT NULL CHECK (budget >= 0),
  deadline DATE,
  licensing TEXT,
  acceptance_criteria TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bounty submissions table
CREATE TABLE bounty_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bounty_id UUID REFERENCES bounties(id) NOT NULL,
  creator_id UUID REFERENCES profiles(id) NOT NULL,
  dataset_id UUID REFERENCES datasets(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_datasets_creator ON datasets(creator_id);
CREATE INDEX idx_datasets_tags ON datasets USING GIN(tags);
CREATE INDEX idx_datasets_price ON datasets(price);
CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_purchases_dataset ON purchases(dataset_id);
CREATE INDEX idx_bounties_creator ON bounties(creator_id);
CREATE INDEX idx_bounties_status ON bounties(status);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bounty_submissions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Datasets policies
CREATE POLICY "Datasets are viewable by everyone"
  ON datasets FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can create datasets"
  ON datasets FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own datasets"
  ON datasets FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own datasets"
  ON datasets FOR DELETE
  USING (auth.uid() = creator_id);

-- Purchases policies
CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert purchases"
  ON purchases FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view datasets they purchased"
  ON datasets FOR SELECT
  USING (
    id IN (
      SELECT dataset_id FROM purchases
      WHERE user_id = auth.uid() AND status = 'completed'
    )
  );

-- Bounties policies
CREATE POLICY "Bounties are viewable by everyone"
  ON bounties FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create bounties"
  ON bounties FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own bounties"
  ON bounties FOR UPDATE
  USING (auth.uid() = creator_id);

-- Bounty submissions policies
CREATE POLICY "Users can view own submissions"
  ON bounty_submissions FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Bounty creators can view submissions"
  ON bounty_submissions FOR SELECT
  USING (
    bounty_id IN (
      SELECT id FROM bounties WHERE creator_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create submissions"
  ON bounty_submissions FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'username');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_datasets_updated_at BEFORE UPDATE ON datasets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bounties_updated_at BEFORE UPDATE ON bounties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
