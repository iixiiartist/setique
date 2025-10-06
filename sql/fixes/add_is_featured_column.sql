-- Add is_featured column to datasets table
-- This column allows admins to feature specific datasets on the homepage
-- Run this in Supabase SQL Editor

-- Add the column with default FALSE (only admins can feature datasets)
ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_datasets_is_featured ON datasets(is_featured) WHERE is_featured = true;

-- Verify the change
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'datasets' 
  AND column_name = 'is_featured';

-- Show current featured status of all datasets
SELECT 
  id,
  title,
  is_featured,
  created_at
FROM datasets
ORDER BY created_at DESC
LIMIT 10;
