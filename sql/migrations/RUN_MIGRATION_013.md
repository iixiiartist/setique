# How to Run Migration 013: Add Foreign Key Constraints

## 📋 Prerequisites
- Supabase dashboard access
- SQL Editor access

## 🚀 Steps to Apply Migration

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your SETIQUE project
3. Click "SQL Editor" in the left sidebar

### Step 2: Run the Migration
1. Copy the contents of `supabase/migrations/013_add_foreign_key_constraints.sql`
2. Paste into a new query in the SQL Editor
3. Click "Run" button

### Step 3: Verify Foreign Keys Were Created
The migration includes a verification query at the end. After running, you should see output showing all the foreign key constraints that were created.

Expected tables with new foreign keys:
- `curation_requests` (creator_id, assigned_curator_id)
- `curator_proposals` (request_id, curator_id)
- `datasets` (creator_id)
- `profiles` (id -> auth.users)
- `pro_curators` (user_id)
- `deletion_requests` (user_id, dataset_id)
- `purchases` (buyer_id, dataset_id)
- `downloads` (user_id, dataset_id)
- `creator_payouts` (creator_id, dataset_id)
- `user_follows` (follower_id, following_id)

## ⚠️ Important Notes

### Potential Issues

**If you get "violates foreign key constraint" errors:**
This means there's existing data that doesn't match. For example:
- A `curation_requests` row with a `creator_id` that doesn't exist in `auth.users`
- A `curator_proposals` row with a `request_id` that doesn't exist in `curation_requests`

**Solution:** Clean up orphaned data before adding constraints:

```sql
-- Find orphaned curation_requests (creators that don't exist)
SELECT cr.id, cr.creator_id 
FROM curation_requests cr
LEFT JOIN auth.users u ON cr.creator_id = u.id
WHERE u.id IS NULL;

-- Find orphaned curator_proposals (requests that don't exist)
SELECT cp.id, cp.request_id 
FROM curator_proposals cp
LEFT JOIN curation_requests cr ON cp.request_id = cr.id
WHERE cr.id IS NULL;

-- Delete orphaned records (if safe to do so)
DELETE FROM curation_requests 
WHERE creator_id NOT IN (SELECT id FROM auth.users);

DELETE FROM curator_proposals 
WHERE request_id NOT IN (SELECT id FROM curation_requests);
```

### Rollback (if needed)

If something goes wrong, you can drop the constraints:

```sql
-- Drop all foreign keys added in this migration
ALTER TABLE curation_requests DROP CONSTRAINT IF EXISTS fk_curation_requests_creator;
ALTER TABLE curation_requests DROP CONSTRAINT IF EXISTS fk_curation_requests_assigned_curator;
ALTER TABLE curator_proposals DROP CONSTRAINT IF EXISTS fk_curator_proposals_request;
ALTER TABLE curator_proposals DROP CONSTRAINT IF EXISTS fk_curator_proposals_curator;
ALTER TABLE datasets DROP CONSTRAINT IF EXISTS fk_datasets_creator;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS fk_profiles_user;
ALTER TABLE pro_curators DROP CONSTRAINT IF EXISTS fk_pro_curators_user;
ALTER TABLE deletion_requests DROP CONSTRAINT IF EXISTS fk_deletion_requests_user;
ALTER TABLE deletion_requests DROP CONSTRAINT IF EXISTS fk_deletion_requests_dataset;
ALTER TABLE purchases DROP CONSTRAINT IF EXISTS fk_purchases_buyer;
ALTER TABLE purchases DROP CONSTRAINT IF EXISTS fk_purchases_dataset;
ALTER TABLE downloads DROP CONSTRAINT IF EXISTS fk_downloads_user;
ALTER TABLE downloads DROP CONSTRAINT IF EXISTS fk_downloads_dataset;
ALTER TABLE creator_payouts DROP CONSTRAINT IF EXISTS fk_creator_payouts_creator;
ALTER TABLE creator_payouts DROP CONSTRAINT IF EXISTS fk_creator_payouts_dataset;
ALTER TABLE user_follows DROP CONSTRAINT IF EXISTS fk_user_follows_follower;
ALTER TABLE user_follows DROP CONSTRAINT IF EXISTS fk_user_follows_following;
```

## ✅ Success Indicators

After running the migration successfully:

1. **No errors in SQL Editor**
2. **Verification query shows 16+ foreign key constraints**
3. **Your app continues to work** (test in dev first!)

## 🔄 Next Steps

Once foreign keys are in place:
1. We can simplify all bounty queries in the codebase
2. PostgREST will automatically support joins like `.select('*, profiles(*)')`
3. Remove manual JavaScript join logic

---

**Need Help?** If you encounter any issues, share the error message and I'll help troubleshoot!
