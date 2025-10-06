-- Add portfolio_samples column to pro_curators table
-- Run this in Supabase SQL Editor

-- Add the missing column
ALTER TABLE pro_curators 
ADD COLUMN IF NOT EXISTS portfolio_samples TEXT[] DEFAULT '{}';

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pro_curators' 
ORDER BY ordinal_position;
