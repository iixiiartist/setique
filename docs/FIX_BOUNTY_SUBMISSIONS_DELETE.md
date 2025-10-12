# Fix Bounty Submissions DELETE Not Working

## Problem
Bounty submissions are not actually being deleted from the database when users or admins click the delete button.

## Root Cause
Most likely the RLS (Row Level Security) DELETE policy for the `bounty_submissions` table is missing or not properly configured in the database.

## Solution

### Step 1: Check Current Console Logs
1. Open your app in the browser
2. Open Developer Tools (F12) → Console tab
3. Try to delete a bounty submission
4. Look for these log messages:
   - `🗑️ Attempting to delete submission:` - shows the attempt
   - `🗑️ Delete result:` - shows if it succeeded or failed
   - `⚠️ No rows were deleted` - indicates RLS policy blocking the delete

### Step 2: Run the SQL Fix in Supabase

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to https://supabase.com/dashboard
2. Open your project
3. Navigate to **SQL Editor**
4. Copy the entire contents of `sql/fixes/ensure_bounty_submissions_delete_policy.sql`
5. Paste and click **Run**
6. Verify you see "Bounty submissions DELETE policies created successfully"

**Option B: Check What Policies Currently Exist**
1. Go to Supabase → SQL Editor
2. Run the diagnostic query from `sql/diagnostic/check_bounty_submissions_delete_policy.sql`
3. This will show if DELETE policies exist

### Step 3: Verify the Fix
1. Refresh your app
2. Try deleting a bounty submission again
3. Check the console logs - you should see:
   - `data: [{ id: '...', ... }]` - the deleted row
   - Alert: "✅ Submission deleted successfully!"
4. The submission should disappear from the list

## What the SQL Does

The fix creates THREE policies:

1. **User Delete Policy**: Allows users to delete their own submissions
   ```sql
   USING (auth.uid() = creator_id)
   ```

2. **Admin Delete Policy**: Allows admins to delete ANY submission
   ```sql
   USING (auth.uid() IN (SELECT user_id FROM admins))
   ```

3. **Admin View/Update Policies**: Ensures admins can see and modify all submissions

## Troubleshooting

### If it still doesn't work:
1. Check the browser console for the exact error message
2. Verify your user_id matches the creator_id of the submission you're trying to delete
3. For admin delete: Verify your user is in the `admins` table
4. Check if RLS is enabled on the table:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'bounty_submissions';
   ```
   Should show `rowsecurity = true`

### Common Issues:
- **"No rows deleted"** → RLS policy is blocking the delete
- **Error 403** → Authentication issue or RLS policy missing
- **Error 42501** → Insufficient privileges
- **Silent failure** → Check browser console logs for details

## Files Created
- `sql/fixes/ensure_bounty_submissions_delete_policy.sql` - The fix
- `sql/diagnostic/check_bounty_submissions_delete_policy.sql` - Diagnostic query
- Updated `DashboardPage.jsx` - Added console logging
- Updated `AdminDashboard.jsx` - Added console logging

## After Running the Fix
The delete functionality should work immediately without needing to restart the app or clear cache.
