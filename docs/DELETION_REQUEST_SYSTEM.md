# Dataset Deletion Request System

## Overview
Implemented a complete workflow where regular users must request permission to delete their datasets, while admins retain the ability to delete any dataset directly. This prevents accidental deletions and gives admins oversight.

## System Components

### 1. Database Schema (`sql/migrations/011_deletion_requests_system.sql`)

**Table: `deletion_requests`**
- `id`: UUID primary key
- `dataset_id`: Reference to dataset (CASCADE delete)
- `requester_id`: User who requested deletion
- `reason`: Text explanation (10-1000 chars)
- `status`: 'pending', 'approved', 'rejected'
- `admin_response`: Admin feedback on rejection
- `reviewed_by`: Admin who reviewed
- `requested_at`: Timestamp of request
- `reviewed_at`: Timestamp of admin action

**RLS Policies:**
- Users can view their own deletion requests
- Users can request deletion of their own datasets
- Only admins can update deletion requests

**Helper Function:**
- `get_pending_deletion_requests_count()`: Returns count for admin dashboard badge

### 2. Backend Functions

**`netlify/functions/request-deletion.js`** (NEW)
- Validates user owns the dataset
- Prevents duplicate pending requests
- Creates deletion request record
- Returns success/error to frontend

**`netlify/functions/admin-actions.js`** (UPDATED)
Added two new actions:
- **`approve_deletion_request`**: 
  - Fetches deletion request
  - Clears `curation_requests.published_dataset_id`
  - Deletes `dataset_partnerships`
  - Deletes dataset
  - Marks request as 'approved'
  
- **`reject_deletion_request`**:
  - Requires admin response message
  - Marks request as 'rejected'
  - Saves admin feedback for user

### 3. Frontend Components

**`src/components/DeletionRequestModal.jsx`** (NEW)
- Modal for users to enter deletion reason
- Shows dataset title confirmation
- Character counter (10-1000 chars)
- Warning notice about admin approval
- Submit button with loading state

**`src/pages/DashboardPage.jsx`** (UPDATED)
- Added deletion requests state
- Added `handleRequestDeletion()` function
- Fetches user's deletion requests
- **Button Logic:**
  - **Admins**: See red "Delete" button (direct delete)
  - **Non-Admins**: See "Request Deletion" button
  - **Pending Request**: Button shows yellow, disabled
  - **Rejected Request**: Button active, shows reject notice
- **Status Display:**
  - Pending: Yellow banner with timestamp
  - Rejected: Red banner with admin response

### 4. Admin Dashboard (TODO)

**Still needs implementation:**
- Add "Deletion Requests" tab
- Fetch pending deletion requests
- Show table with:
  - Dataset title
  - Requester name
  - Reason
  - Requested date
- Action buttons:
  - Approve (deletes dataset)
  - Reject (requires admin response textarea)

## Workflow

### User Flow:
1. User clicks "Request Deletion" button on their dataset
2. Modal opens requesting reason (min 10 chars)
3. User submits request
4. Button shows "Pending" status with yellow background
5. User sees yellow banner: "⏳ Deletion request pending admin review"
6. If rejected:
   - Banner turns red
   - Shows admin response
   - User can request again

### Admin Flow:
1. Admin sees pending requests in Admin Dashboard
2. Reviews dataset info and user's reason
3. **Approve**:
   - Dataset deleted (cascade: partnerships, curation references)
   - Request marked 'approved'
   - User's dataset removed from dashboard
4. **Reject**:
   - Admin provides feedback
   - Request marked 'rejected'
   - User can see rejection reason and request again

## Database Migration

**Run in Supabase SQL Editor:**
```sql
-- Located at: sql/migrations/011_deletion_requests_system.sql
-- Creates deletion_requests table
-- Sets up RLS policies
-- Creates helper function
```

## Security Features

1. **RLS Policies**: Users can only request deletion of their own datasets
2. **Admin Verification**: All admin actions verify admin table membership
3. **Duplicate Prevention**: Prevents multiple pending requests for same dataset
4. **Validation**: Reason must be 10-1000 characters
5. **Cascade Delete**: Properly handles all foreign key relationships

## API Endpoints

### Request Deletion
```javascript
POST /.netlify/functions/request-deletion
Headers: { Authorization: 'Bearer <token>' }
Body: {
  datasetId: 'uuid',
  reason: 'string (10-1000 chars)'
}
Response: {
  message: 'Deletion request submitted successfully',
  request: { /* deletion_request record */ }
}
```

### Admin Approve/Reject
```javascript
POST /.netlify/functions/admin-actions
Body: {
  userId: 'admin-uuid',
  action: 'approve_deletion_request' | 'reject_deletion_request',
  targetId: 'deletion-request-uuid',
  details: {
    adminResponse: 'optional message for approve, required for reject'
  }
}
```

## Testing Checklist

- [ ] **Run database migration** in Supabase
- [ ] **Test user request flow**:
  - Non-admin user requests deletion
  - Reason validation (min 10 chars)
  - Duplicate request prevention
  - Pending status displays correctly
- [ ] **Complete Admin Dashboard UI**:
  - Add "Deletion Requests" tab
  - Show pending requests table
  - Implement approve/reject handlers
- [ ] **Test admin approval**:
  - Admin approves request
  - Dataset deleted from database
  - Partnerships cleared
  - User's dashboard updates
- [ ] **Test admin rejection**:
  - Admin rejects with feedback
  - User sees rejection message
  - User can request again
- [ ] **Test edge cases**:
  - Dataset with partnerships
  - Dataset from curation workflow
  - Multiple pending requests by same user

## Files Modified/Created

**Created:**
- `sql/migrations/011_deletion_requests_system.sql`
- `netlify/functions/request-deletion.js`
- `src/components/DeletionRequestModal.jsx`

**Modified:**
- `netlify/functions/admin-actions.js` (added 2 new actions)
- `src/pages/DashboardPage.jsx` (added deletion request logic)

## Status: Partial Implementation

✅ **Complete:**
- Database schema
- RLS policies
- User request submission
- Request deletion function
- Deletion request modal
- User dashboard UI (request button + status display)
- Admin approval/rejection backend logic

⏳ **TODO:**
- Admin Dashboard "Deletion Requests" tab UI
- Approve/Reject buttons in Admin Dashboard
- Admin response textarea for rejections
- Testing complete workflow

## Next Steps

1. **Run Migration:**
   ```sql
   -- Execute: sql/migrations/011_deletion_requests_system.sql
   ```

2. **Complete Admin UI:**
   - Add deletion requests state to AdminDashboard.jsx
   - Add "Deletion Requests" tab button
   - Create pending requests table
   - Add approve/reject action handlers

3. **Test Workflow:**
   - User requests deletion
   - Admin approves/rejects
   - Verify database cascades
   - Check UI updates

4. **Deploy:**
   - Commit and push
   - Verify Netlify functions deployed
   - Test on production
