# Beta Access System

## Overview

The Beta Access System provides controlled onboarding for new users during the beta phase. It automatically creates beta access records when users sign up, allows admins to review and approve/reject applications, generates unique access codes, and gates platform features until users redeem their codes.

## Architecture

### Database Schema

**Table: `beta_access`**
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to auth.users
- `email` (TEXT) - User's email address
- `status` (TEXT) - One of: `pending_approval`, `approved`, `rejected`, `waitlist`
- `access_code` (TEXT) - Unique code in format `BETA-XXXX-XXXX`
- `code_used_at` (TIMESTAMP) - When the user redeemed their code
- `priority` (INTEGER) - Priority ranking (higher = more important)
- `approved_by` (UUID) - Admin who approved/rejected
- `admin_notes` (TEXT) - Internal admin notes
- `signup_source` (TEXT) - Where the user came from (optional)
- `created_at` (TIMESTAMP) - When user signed up
- `updated_at` (TIMESTAMP) - Last status change

**Indexes:**
- `user_id` (unique)
- `status`
- `access_code` (unique)
- `created_at`
- `priority` (partial index on pending_approval)

**RLS Policies:**
1. Users can view their own beta_access record
2. Users can update their own code_used_at (when redeeming)
3. Admins can view all records
4. Admins can update all records
5. Admins can insert records

### Functions & RPCs

#### `generate_access_code()`
Returns a unique access code in format `BETA-XXXX-XXXX` using MD5 hash of UUID + timestamp.

#### `create_beta_access_on_signup()`
Trigger function that fires when a new profile is created. Automatically creates a beta_access record with:
- Status: `pending_approval`
- Generated access code
- User's email from profile

#### `has_beta_access()`
Boolean RPC that checks if the current user has completed beta access:
- Returns `true` if: status = 'approved' AND code_used_at IS NOT NULL
- Returns `false` otherwise

Used by `BetaProtectedRoute` to gate access to features.

#### `admin_approve_beta_user(p_user_id UUID, p_admin_notes TEXT DEFAULT NULL)`
Admin RPC to approve a user. Returns user info + access code for sending via email.
- Sets status to 'approved'
- Records admin who approved
- Adds optional admin notes
- Returns: email, access_code, full_name

#### `admin_reject_beta_user(p_user_id UUID, p_admin_notes TEXT DEFAULT NULL)`
Admin RPC to reject a user.
- Sets status to 'rejected'
- Records admin who rejected
- Adds optional rejection reason

#### `redeem_access_code(code TEXT)`
User RPC to activate their account with access code.
- Validates code matches user's record
- Checks user is in 'approved' status
- Sets code_used_at to now()
- Returns success message

## User Flow

### 1. Signup
When a user creates an account:
1. Profile is created in `profiles` table
2. Trigger automatically creates `beta_access` record
3. Status is set to `pending_approval`
4. Unique access code is generated
5. User is redirected to beta queue page

### 2. Pending State
User sees `BetaAccessGate` component with:
- "You're in the Beta Queue!" message
- Explanation of next steps
- Their email address
- Access code entry form (for if they already received code via email)

### 3. Admin Review
Admin logs into AdminDashboard and:
1. Clicks "🔐 Beta Access" tab
2. Reviews pending signups
3. Can see user info (email, signup date, priority)
4. Options:
   - **Approve**: User gets approved, access code shown in alert
   - **Reject**: User rejected with optional reason
   - **Move to Waitlist**: User moved to waitlist status
   - **Batch Approve**: Select multiple users, approve all at once

### 4. Approval
When admin clicks "Approve":
1. `admin_approve_beta_user()` RPC called
2. Status changes to 'approved'
3. Access code returned in alert (to be emailed)
4. User can now redeem their code

### 5. Code Redemption
User enters their access code in `BetaAccessGate`:
1. Code is validated via `redeem_access_code()` RPC
2. If valid: `code_used_at` is set
3. Page reloads to update auth context
4. User now has full platform access

### 6. Protected Routes
Routes wrapped in `<BetaProtectedRoute>`:
- Check `has_beta_access()` on mount
- If false: show `BetaAccessGate`
- If true: render children

## Components

### `BetaAccessManagement.jsx`
Admin dashboard component for managing beta signups.

**Features:**
- Stats display (pending, approved, rejected, waitlist counts)
- Tab navigation by status
- User cards with profile info
- Individual actions: Approve, Reject, Waitlist, Resend Code
- Batch operations with checkboxes
- Admin notes support

**Usage:**
```jsx
import BetaAccessManagement from '../components/BetaAccessManagement'

// In AdminDashboard.jsx
{activeTab === 'beta' && (
  <div>
    <h2 className="text-2xl font-extrabold mb-6">Beta Access Management</h2>
    <BetaAccessManagement />
  </div>
)}
```

### `BetaAccessGate.jsx`
User-facing component that shows beta queue status and code entry.

**States:**
1. **Loading**: Spinner while checking status
2. **Pending Approval**: Queue message with code entry form
3. **Approved (not redeemed)**: Shows access code prominently
4. **Waitlist**: Waitlist message
5. **Rejected**: Rejection message with admin notes
6. **Approved + Redeemed**: Returns null (user has access)

**Usage:**
```jsx
import BetaAccessGate from '../components/BetaAccessGate'

// Shows automatically based on user status
<BetaAccessGate />
```

### `BetaProtectedRoute.jsx`
Wrapper component that gates access to features.

**Logic:**
1. Checks if user is logged in
2. Calls `has_beta_access()` RPC
3. If no access: renders `<BetaAccessGate />`
4. If has access: renders children

**Usage:**
```jsx
import BetaProtectedRoute from '../components/BetaProtectedRoute'

// Wrap any route that requires beta access
<Route path="/upload" element={
  <BetaProtectedRoute>
    <UploadDataset />
  </BetaProtectedRoute>
} />

// Or wrap multiple routes
<Route element={<BetaProtectedRoute />}>
  <Route path="/upload" element={<UploadDataset />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/marketplace" element={<Marketplace />} />
</Route>
```

## Email Integration (Pending)

Currently, access codes are shown in browser alerts. To implement email notifications:

### Option 1: Supabase Edge Functions
```typescript
// supabase/functions/send-beta-approval/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { email, accessCode, fullName } = await req.json()
  
  // Send email via Resend, SendGrid, etc.
  await sendEmail({
    to: email,
    subject: 'You've been approved for SETIQUE Beta!',
    html: `
      <h1>Welcome to SETIQUE, ${fullName}!</h1>
      <p>Your beta access has been approved!</p>
      <p>Your access code: <strong>${accessCode}</strong></p>
      <p>Enter this code at setique.com to unlock full platform access.</p>
    `
  })
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### Option 2: Database Trigger + External Service
Add a webhook in the database trigger that calls an external email service when status changes to 'approved'.

### Option 3: Scheduled Task
Run a cron job that checks for newly approved users without code_used_at and sends emails.

## Testing Checklist

### Database
- [ ] Run migration 024 on development database
- [ ] Verify beta_access table created with all columns
- [ ] Check indexes exist
- [ ] Test RLS policies (as user, as admin)
- [ ] Verify trigger creates record on profile insert
- [ ] Test all RPC functions

### Admin Dashboard
- [ ] Login as admin
- [ ] Navigate to 🔐 Beta Access tab
- [ ] Verify stats display correctly
- [ ] Create test users in different statuses
- [ ] Test approve action (check alert shows code)
- [ ] Test reject action with notes
- [ ] Test move to waitlist
- [ ] Test batch approve with checkboxes
- [ ] Verify refresh updates UI

### User Experience
- [ ] Create new account
- [ ] Verify redirected to beta queue page
- [ ] Check "pending approval" message displays
- [ ] Admin approves user
- [ ] Refresh page, verify "approved" state
- [ ] Enter access code
- [ ] Verify page reloads and access granted
- [ ] Try accessing protected route
- [ ] Verify no gate shown (has access)

### Edge Cases
- [ ] Try redeeming invalid code
- [ ] Try redeeming code twice
- [ ] Try redeeming code before approval
- [ ] Test rejection flow
- [ ] Test waitlist flow
- [ ] Verify non-logged-in users can't access beta RPCs
- [ ] Test admin can't approve own account

## Deployment Steps

### 1. Run Migration
```bash
# Apply migration to production
supabase db push

# Or via SQL editor
-- Copy contents of 024_beta_access_system.sql and execute
```

### 2. Update Code
Ensure these files are deployed:
- `supabase/migrations/024_beta_access_system.sql`
- `src/components/BetaAccessManagement.jsx`
- `src/components/BetaAccessGate.jsx`
- `src/components/BetaProtectedRoute.jsx`
- `src/pages/AdminDashboard.jsx` (with beta tab)

### 3. Wrap Routes
Update `App.jsx` or router config to wrap protected routes:

```jsx
import BetaProtectedRoute from './components/BetaProtectedRoute'

// Example route wrapping
<Route path="/upload" element={
  <BetaProtectedRoute>
    <UploadDataset />
  </BetaProtectedRoute>
} />
```

### 4. Configure Email (Optional)
Set up email service integration for automatic code delivery.

### 5. Test in Production
- Create test account
- Verify beta queue appears
- Admin approves test account
- Redeem code
- Verify full access granted

## Admin Quick Start

### Approving Users

1. Go to Admin Dashboard
2. Click "🔐 Beta Access" tab
3. Review pending users
4. Click "✅ Approve" on user card
5. Copy access code from alert
6. Send code to user via email manually (or wait for automatic email)

### Batch Approval

1. Click "Select All" or check individual users
2. Click "Batch Approve" button
3. All selected users approved
4. Access codes shown (copy and send)

### Rejecting Users

1. Click "❌ Reject" on user card
2. Optionally add rejection reason
3. User will see rejection message with reason

### Managing Waitlist

1. Click "⏸️ Waitlist" to move user to waitlist
2. Users on waitlist see "You're on the Waitlist" message
3. Later, can approve from waitlist tab

## Configuration

### Disabling Beta Access

To disable beta access checks (e.g., after beta period):

**Option 1: Remove Route Wrappers**
Remove `<BetaProtectedRoute>` from routes in `App.jsx`.

**Option 2: Update has_beta_access() Function**
```sql
CREATE OR REPLACE FUNCTION has_beta_access()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT true; -- Always return true
$$;
```

**Option 3: Mass Approve All Users**
```sql
UPDATE beta_access 
SET status = 'approved', 
    code_used_at = now()
WHERE status IN ('pending_approval', 'waitlist');
```

### Adjusting Priority

Higher priority users can be shown first in admin dashboard:

```sql
-- Set VIP priority
UPDATE beta_access 
SET priority = 100 
WHERE email = 'vip@example.com';

-- Prioritize by signup date
UPDATE beta_access 
SET priority = EXTRACT(EPOCH FROM created_at)::INTEGER 
WHERE status = 'pending_approval';
```

## Troubleshooting

### User can't redeem code
- Check status is 'approved' (not pending/rejected/waitlist)
- Verify code matches exactly (case-insensitive but must match format)
- Check code hasn't already been used (code_used_at is NULL)

### Trigger not creating beta_access record
- Verify trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'create_beta_access_on_signup_trigger';`
- Check trigger function: `\df create_beta_access_on_signup`
- Manually create record: `INSERT INTO beta_access (user_id, email, status) VALUES (...)`

### Admin can't see pending users
- Verify admin record exists in `admins` table
- Check RLS policies allow admin read access
- Refresh page to fetch latest data

### BetaAccessGate not showing
- Check `has_beta_access()` returns false for user
- Verify `BetaProtectedRoute` is wrapping the route
- Check console for errors in useEffect

## Security Considerations

- ✅ RLS policies prevent users from modifying other users' records
- ✅ Only admins can approve/reject users
- ✅ Access codes are unique and single-use
- ✅ Trigger runs with SECURITY DEFINER to bypass RLS
- ✅ RPCs validate user context before execution
- ⚠️ Access codes in alerts are temporary (implement email ASAP)
- ⚠️ Admins can see all user emails (expected behavior)

## Future Enhancements

1. **Automated Emails**: Integrate with Resend/SendGrid for automatic code delivery
2. **Invite Codes**: Allow users to invite others with special codes
3. **Usage Analytics**: Track beta user engagement and features usage
4. **Quota System**: Limit approvals per day/week
5. **Referral System**: Priority queue for referred users
6. **Slack Integration**: Notify team in Slack when new user signs up
7. **Application Form**: Collect more info during signup (use case, company, etc.)
8. **Automated Approval**: Auto-approve users with specific email domains
9. **Expiring Codes**: Access codes expire after 7 days
10. **Survey on Rejection**: Ask rejected users for feedback

## Support

For questions or issues with the beta access system:
- Email: dev@setique.com
- Check console logs for detailed error messages
- Review Supabase logs for RPC call failures
- Test in incognito mode to rule out caching issues
