-- STEP 3: Update budget fields (Run this fourth)
ALTER TABLE curation_requests DROP COLUMN IF EXISTS budget_range;
ALTER TABLE curation_requests ADD COLUMN IF NOT EXISTS budget_min DECIMAL(10,2);
ALTER TABLE curation_requests ADD COLUMN IF NOT EXISTS budget_max DECIMAL(10,2);
