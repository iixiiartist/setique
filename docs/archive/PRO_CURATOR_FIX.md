# Pro Curator Portfolio Samples Fix

## Problem
The `pro_curators` table is missing the `portfolio_samples` column, causing a 400 error when users try to apply for pro curator certification.

**Error Message:**
```
Failed to submit application: Could not find the 'portfolio_samples' column of 'pro_curators' in the schema cache
```

## Solution

### Option 1: Quick Fix - Add Missing Column (Recommended)
Run this SQL in your **Supabase SQL Editor**:

```sql
-- Add the missing column
ALTER TABLE pro_curators 
ADD COLUMN IF NOT EXISTS portfolio_samples TEXT[] DEFAULT '{}';
```

**Verification:**
```sql
-- Check if the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pro_curators' 
ORDER BY ordinal_position;
```

You should see `portfolio_samples` listed with type `ARRAY`.

### Option 2: Recreate Table with Full Schema
If Option 1 doesn't work, run the complete table creation script:

**File:** `sql/setup/create_pro_curators_table.sql`

This will create the table with all required columns including `portfolio_samples`.

## Why This Happened

The migration file `supabase/migrations/008_pro_curator_system.sql` was missing the `portfolio_samples TEXT[]` column that the application code expects. The `create_pro_curators_table.sql` setup script has it, but if you ran the migration instead of the setup script, the column would be missing.

## Testing After Fix

1. Run the SQL fix in Supabase
2. Refresh your application (hard refresh: `Ctrl + Shift + R`)
3. Try submitting a pro curator application
4. The error should be gone!

## Files Involved

- **Fix Script:** `sql/fixes/add_portfolio_samples_column.sql`
- **Setup Script:** `sql/setup/create_pro_curators_table.sql`
- **Migration:** `supabase/migrations/008_pro_curator_system.sql`
- **Application Code:** `src/components/ProCuratorProfile.jsx`

---

**Created:** January 2025
**Status:** Ready to apply
