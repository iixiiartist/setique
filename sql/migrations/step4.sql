-- STEP 4: Update index (Run this fifth)
DROP INDEX IF EXISTS idx_curation_requests_requester;
DROP INDEX IF EXISTS idx_curation_requests_creator;
CREATE INDEX idx_curation_requests_creator ON curation_requests(creator_id);
