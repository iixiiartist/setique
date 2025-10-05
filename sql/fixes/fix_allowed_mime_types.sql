-- Add missing mime types to datasets bucket
-- Run this in Supabase SQL Editor

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'text/csv',
  'text/plain',
  'text/markdown',
  'application/json',
  'application/jsonl',
  'application/x-jsonlines',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-tar',
  'application/gzip',
  'application/x-gzip',
  'application/parquet',
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'audio/mpeg',
  'audio/wav',
  'audio/flac',
  'audio/ogg',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/octet-stream'
]
WHERE id = 'datasets';
