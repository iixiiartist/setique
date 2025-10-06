-- STEP 2: Rename column (Run this third)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'curation_requests' 
    AND column_name = 'requester_id'
  ) THEN
    ALTER TABLE curation_requests RENAME COLUMN requester_id TO creator_id;
  END IF;
END $$;
