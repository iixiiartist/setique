-- Create storage bucket for datasets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'datasets',
  'datasets',
  false,
  524288000, -- 500MB max
  ARRAY[
    'text/csv',
    'application/json',
    'application/zip',
    'application/x-tar',
    'application/gzip',
    'video/mp4',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav',
    'audio/flac',
    'image/jpeg',
    'image/png'
  ]
);

-- Note: Storage RLS policies are configured through the Supabase Dashboard
-- Go to Storage > datasets bucket > Policies to set up access rules

-- Add download tracking table
CREATE TABLE download_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  dataset_id UUID REFERENCES datasets(id) NOT NULL,
  purchase_id UUID REFERENCES purchases(id),
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for download logs
CREATE INDEX idx_download_logs_user ON download_logs(user_id);
CREATE INDEX idx_download_logs_dataset ON download_logs(dataset_id);
CREATE INDEX idx_download_logs_purchase ON download_logs(purchase_id);
CREATE INDEX idx_download_logs_date ON download_logs(downloaded_at);

-- Enable RLS on download_logs
ALTER TABLE download_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own download logs
CREATE POLICY "Users can view own download logs"
ON download_logs FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Creators can view downloads of their datasets
CREATE POLICY "Creators can view dataset downloads"
ON download_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM datasets
    WHERE datasets.id = download_logs.dataset_id
    AND datasets.creator_id = auth.uid()
  )
);
