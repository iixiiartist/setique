-- Add missing columns to datasets table
-- These columns are needed for storing direct file uploads from bounty submissions

-- Add file_url column (stores the Supabase storage URL)
ALTER TABLE datasets
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Add file_size column (stores file size in bytes)
ALTER TABLE datasets
ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Add license column (stores the license type)
ALTER TABLE datasets
ADD COLUMN IF NOT EXISTS license TEXT DEFAULT 'Commercial';

-- Add comments for documentation
COMMENT ON COLUMN datasets.file_url IS 'Direct URL to file in Supabase storage (for uploaded datasets)';
COMMENT ON COLUMN datasets.file_size IS 'File size in bytes (for uploaded datasets)';
COMMENT ON COLUMN datasets.license IS 'License type: Commercial, Non-Commercial, Research';

-- Verify columns were added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'datasets'
AND column_name IN ('file_url', 'file_size', 'license')
ORDER BY column_name;
