# 🔍 SOCIAL NOTIFICATIONS DIAGNOSTIC

## Problem
Likes (favorites) and follows are NOT generating notifications, even though:
- ✅ Code calls `logDatasetFavorited()` and `logUserFollowed()`
- ✅ These functions call `createNotification()`
- ✅ No errors in console
- ❌ Notifications don't appear

## Root Cause Analysis

### Most Likely Issue: Missing RPC Function
The `create_notification()` RPC function may not be in your database!

**Why this happens silently:**
- JavaScript `await supabase.rpc('create_notification', {...})` returns
- But if RPC doesn't exist, Supabase returns `null` (no error thrown)
- Activity tracking works (logs to `user_activities`)
- But notification creation fails silently

## 🎯 Diagnostic Steps

### Step 1: Check if Notifications Migration Was Applied

1. **Open Supabase Dashboard** → SQL Editor
2. **Run this query**:

```sql
-- Check if create_notification RPC function exists
SELECT 
  routine_name, 
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%notification%';
```

**Expected Result (if migration applied):**
```
routine_name           | routine_type | routine_definition
-----------------------|--------------|-------------------
create_notification    | FUNCTION     | BEGIN ... END
mark_notification_read | FUNCTION     | ...
mark_all_read          | FUNCTION     | ...
get_unread_count       | FUNCTION     | ...
```

**If you see 0 results:** Migration NOT applied ❌

### Step 2: Check if Notifications Table Exists

```sql
-- Check if notifications table exists
SELECT 
  table_name, 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'notifications'
AND table_schema = 'public'
ORDER BY ordinal_position;
```

**Expected Result:**
```
table_name    | column_name    | data_type
--------------|----------------|----------
notifications | id             | uuid
notifications | user_id        | uuid
notifications | actor_id       | uuid
notifications | activity_type  | text
notifications | target_id      | uuid
notifications | target_type    | text
notifications | message        | text
notifications | read           | boolean
notifications | created_at     | timestamp with time zone
```

**If you see 0 results:** Table doesn't exist ❌

## ✅ Solution

### If Migration NOT Applied:

1. **Open Supabase Dashboard** → SQL Editor
2. **Copy ENTIRE contents** of `sql/migrations/20251012_notifications_system.sql`
3. **Paste and Run**
4. Wait for success message
5. **Then also apply:**
   - `sql/migrations/20251014_fix_notifications_messages.sql`
   - `sql/migrations/20251014_fix_notifications_constraint.sql`

### If Migration WAS Applied:

Test the RPC function manually:

```sql
-- Test create_notification function
SELECT create_notification(
  'YOUR_USER_ID_HERE'::uuid,  -- user_id (who receives notification)
  'ACTOR_USER_ID_HERE'::uuid,  -- actor_id (who did the action)
  'dataset_favorited',          -- activity_type
  'SOME_DATASET_ID'::uuid,      -- target_id
  'dataset',                    -- target_type
  'testuser favorited your dataset Test Dataset'  -- message
);
```

Replace the UUIDs with actual IDs from your database.

**If this returns an error:** The function has issues
**If this returns a UUID:** Function works, issue is elsewhere

## 🧪 Manual Testing

### Test Favorite Notification:

1. **User A** creates/owns a dataset
2. **User B** signs in (different account)
3. **User B** clicks the heart icon to favorite User A's dataset
4. **Check User A's notifications:**
   - Go to `/notifications` page
   - Should see: "**@userB** favorited Dataset Title"

### Test Follow Notification:

1. **User A** has a profile
2. **User B** signs in (different account)
3. **User B** goes to User A's profile (`/profile/username`)
4. **User B** clicks "Follow" button
5. **Check User A's notifications:**
   - Go to `/notifications` page
   - Should see: "**@userB** followed you"

## 🔧 Alternative: Check Errors in activityTracking.js

The code has try/catch blocks that suppress errors. Let's add better logging:

### Temporary Debug Version:

Add this to `src/lib/activityTracking.js` at line 271 (in logDatasetFavorited):

```javascript
// Notify the dataset owner if provided
if (ownerId && ownerId !== userId) {
  // Get user's username
  const { data: profileData } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .single();

  const username = profileData?.username || 'Someone';
  const message = generateNotificationMessage('dataset_favorited', username, { datasetName: datasetTitle });
  
  console.log('🔔 ATTEMPTING TO CREATE NOTIFICATION:', {
    ownerId,
    userId,
    activityType: 'dataset_favorited',
    datasetId,
    message
  });
  
  const result = await createNotification(
    ownerId,
    userId,
    'dataset_favorited',
    datasetId,
    'dataset',
    message
  );
  
  console.log('🔔 NOTIFICATION RESULT:', result);
}
```

Then test favoriting again and check console for these logs.

## 📋 Expected Console Output

**If RPC function exists:**
```javascript
🔔 ATTEMPTING TO CREATE NOTIFICATION: {
  ownerId: "uuid-here",
  userId: "uuid-here",
  activityType: "dataset_favorited",
  datasetId: "uuid-here",
  message: "testuser favorited your dataset AI Training"
}
🔔 NOTIFICATION RESULT: "uuid-of-notification"
```

**If RPC function missing:**
```javascript
🔔 ATTEMPTING TO CREATE NOTIFICATION: { ... }
🔔 NOTIFICATION RESULT: null  ← RED FLAG!
```

## 🎯 Quick Fix Commands

If you need to apply all notification migrations at once:

```sql
-- Run this in Supabase SQL Editor
-- It checks if each migration is needed and applies them

-- 1. Check and create notifications table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    RAISE NOTICE 'Notifications table missing - applying migration...';
    -- Then paste full 20251012_notifications_system.sql here
  ELSE
    RAISE NOTICE '✅ Notifications table exists';
  END IF;
END $$;

-- 2. Check RPC functions
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ No notification RPC functions found - migration NOT applied'
    ELSE '✅ Found ' || COUNT(*) || ' notification RPC functions'
  END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('create_notification', 'mark_notification_read', 'mark_all_read', 'get_unread_count');
```

## 🚨 Most Common Issues

### Issue 1: Self-Notification Prevention ✅
**This is CORRECT behavior:**
- You don't get notified when you favorite your own dataset
- You don't get notified when you follow yourself
- Check that test user IDs are DIFFERENT

### Issue 2: Migration Not Applied ❌
**Symptoms:**
- No errors in console
- `createNotification()` returns `null`
- Notifications table empty

**Fix:** Apply `sql/migrations/20251012_notifications_system.sql`

### Issue 3: Constraint Violation ❌
**Symptoms:**
- Error in console: "violates check constraint"
- Error code: 23514

**Fix:** Apply `sql/migrations/20251014_fix_notifications_constraint.sql`

### Issue 4: Missing comment_reply Type ❌
**Symptoms:**
- Comments work, but replies don't notify
- Error: "invalid activity type"

**Fix:** Apply `sql/migrations/20251014_fix_notifications_constraint.sql`

## 📊 Summary Checklist

Run these checks in order:

- [ ] Open Supabase SQL Editor
- [ ] Check if `notifications` table exists (query above)
- [ ] Check if `create_notification` RPC exists (query above)
- [ ] If either missing, apply `20251012_notifications_system.sql`
- [ ] Apply `20251014_fix_notifications_messages.sql`
- [ ] Apply `20251014_fix_notifications_constraint.sql`
- [ ] Test with TWO DIFFERENT user accounts
- [ ] User B favorites User A's dataset
- [ ] Check User A's notifications page
- [ ] User B follows User A
- [ ] Check User A's notifications page

---

**Most likely result:** You'll find the notifications migration was never applied to your database. Once you apply it, ALL social notifications will start working immediately! 🎉
