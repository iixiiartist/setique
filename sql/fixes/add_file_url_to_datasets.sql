-- Add missing file_url and file_size columns to datasets table
-- These columns are needed for storing direct file uploads from bounty submissions

-- Add file_url column (stores the Supabase storage URL)
ALTER TABLE datasets
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Add file_size column (stores file size in bytes)
ALTER TABLE datasets
ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Add comment for documentation
COMMENT ON COLUMN datasets.file_url IS 'Direct URL to file in Supabase storage (for uploaded datasets)';
COMMENT ON COLUMN datasets.file_size IS 'File size in bytes (for uploaded datasets)';

-- Verify columns were added
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'datasets'
AND column_name IN ('file_url', 'file_size')
ORDER BY column_name;
