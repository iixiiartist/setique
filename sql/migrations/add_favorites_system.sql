-- Add Favorites/Bookmarks System for Datasets
-- Allows users to save datasets they're interested in

BEGIN;

-- =====================================================
-- STEP 1: Create dataset_favorites table
-- =====================================================

CREATE TABLE IF NOT EXISTS dataset_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique favorites (can't favorite same dataset twice)
  CONSTRAINT unique_favorite UNIQUE (dataset_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dataset_favorites_dataset ON dataset_favorites(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_favorites_user ON dataset_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_dataset_favorites_created ON dataset_favorites(created_at DESC);

-- =====================================================
-- STEP 2: Add favorite_count to datasets table
-- =====================================================

ALTER TABLE datasets ADD COLUMN IF NOT EXISTS favorite_count INTEGER DEFAULT 0;

-- Update existing datasets to have correct favorite counts
UPDATE datasets
SET favorite_count = (
  SELECT COUNT(*)
  FROM dataset_favorites
  WHERE dataset_favorites.dataset_id = datasets.id
)
WHERE favorite_count = 0;

-- =====================================================
-- STEP 3: Create trigger to auto-update favorite_count
-- =====================================================

-- Function to increment favorite count
CREATE OR REPLACE FUNCTION increment_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE datasets
  SET favorite_count = favorite_count + 1
  WHERE id = NEW.dataset_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement favorite count
CREATE OR REPLACE FUNCTION decrement_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE datasets
  SET favorite_count = GREATEST(0, favorite_count - 1)
  WHERE id = OLD.dataset_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on INSERT
DROP TRIGGER IF EXISTS increment_favorite_count_trigger ON dataset_favorites;
CREATE TRIGGER increment_favorite_count_trigger
  AFTER INSERT ON dataset_favorites
  FOR EACH ROW
  EXECUTE FUNCTION increment_favorite_count();

-- Trigger on DELETE
DROP TRIGGER IF EXISTS decrement_favorite_count_trigger ON dataset_favorites;
CREATE TRIGGER decrement_favorite_count_trigger
  AFTER DELETE ON dataset_favorites
  FOR EACH ROW
  EXECUTE FUNCTION decrement_favorite_count();

-- =====================================================
-- STEP 4: RLS Policies for dataset_favorites
-- =====================================================

ALTER TABLE dataset_favorites ENABLE ROW LEVEL SECURITY;

-- Users can view their own favorites
DROP POLICY IF EXISTS "Users can view their own favorites" ON dataset_favorites;
CREATE POLICY "Users can view their own favorites"
ON dataset_favorites
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can view favorite counts for any dataset (public info)
DROP POLICY IF EXISTS "Anyone can view favorite counts" ON dataset_favorites;
CREATE POLICY "Anyone can view favorite counts"
ON dataset_favorites
FOR SELECT
TO authenticated
USING (true);

-- Users can add favorites
DROP POLICY IF EXISTS "Users can add favorites" ON dataset_favorites;
CREATE POLICY "Users can add favorites"
ON dataset_favorites
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can remove their own favorites
DROP POLICY IF EXISTS "Users can remove their own favorites" ON dataset_favorites;
CREATE POLICY "Users can remove their own favorites"
ON dataset_favorites
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all favorites
DROP POLICY IF EXISTS "Admins can view all favorites" ON dataset_favorites;
CREATE POLICY "Admins can view all favorites"
ON dataset_favorites
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM admins
  )
);

-- =====================================================
-- STEP 5: Verification queries
-- =====================================================

-- Verify table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'dataset_favorites'
ORDER BY ordinal_position;

-- Verify indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'dataset_favorites';

-- Verify policies
SELECT 
  policyname,
  cmd,
  qual as "USING clause"
FROM pg_policies
WHERE tablename = 'dataset_favorites'
ORDER BY cmd, policyname;

-- Verify triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'dataset_favorites';

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Dataset favorites system created successfully!';
  RAISE NOTICE 'Tables: dataset_favorites';
  RAISE NOTICE 'Columns added: datasets.favorite_count';
  RAISE NOTICE 'Triggers: Auto-update favorite counts';
  RAISE NOTICE 'RLS: Enabled with user and admin policies';
END $$;
