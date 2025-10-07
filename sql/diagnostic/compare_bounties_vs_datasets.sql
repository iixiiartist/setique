-- Check what's in curation_requests vs what's in datasets
SELECT 'curation_requests' as table_name, id, title, created_at, status
FROM curation_requests
ORDER BY created_at DESC
LIMIT 10;

-- Check datasets (what's showing on homepage)
SELECT 'datasets' as table_name, id, title, created_at, is_published, creator_id
FROM datasets
ORDER BY created_at DESC
LIMIT 10;

-- Check if there are any bounties/curation_requests
SELECT COUNT(*) as total_bounties FROM curation_requests;

-- Check if there are any datasets
SELECT COUNT(*) as total_datasets FROM datasets;
