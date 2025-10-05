# Bounty System - Current State & Implementation Plan

## Current Status: **Partially Implemented**

### ✅ What's Working:
1. **Database Schema**: Complete and ready
   - `bounties` table with all fields
   - `bounty_submissions` table with status tracking
   - RLS policies configured
   - Indexes for performance

2. **Bounty Creation**: 
   - Users can post bounties via the form on homepage
   - Fields: title, description, modality, quantity, budget, tags, deadline
   - Stored in database successfully

3. **Bounty Display**:
   - All bounties listed in dedicated section
   - Bounty cards show: title, modality, budget, quantity
   - Modal with full details when clicked
   - Demo bounties labeled with (DEMO)

### ❌ What's Missing:

1. **Submission Flow**: No way for creators to submit datasets to bounties
2. **Submission Review**: Bounty posters can't see submissions
3. **Approval/Purchase Flow**: No mechanism to accept and purchase submissions
4. **Dashboard Integration**: No bounty management in dashboard
5. **Notifications**: No alerts when someone submits to your bounty

---

## Database Schema

### **bounties Table**
```sql
CREATE TABLE bounties (
  id UUID PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  modality TEXT NOT NULL,
  quantity TEXT,
  budget NUMERIC(10,2) NOT NULL,
  deadline DATE,
  status TEXT DEFAULT 'active', -- 'active', 'in_progress', 'completed', 'cancelled'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### **bounty_submissions Table**
```sql
CREATE TABLE bounty_submissions (
  id UUID PRIMARY KEY,
  bounty_id UUID REFERENCES bounties(id),
  creator_id UUID REFERENCES profiles(id),
  dataset_id UUID REFERENCES datasets(id),
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  notes TEXT,
  submitted_at TIMESTAMP
);
```

### **RLS Policies**
- ✅ Users can view own submissions
- ✅ Bounty creators can view all submissions to their bounties
- ✅ Authenticated users can create submissions

---

## Proposed User Flow

### **For Dataset Creators (Submitting to Bounties):**

1. **Browse Bounties**:
   - See list of active bounties on homepage
   - Filter by modality, budget range
   - Click to see full details

2. **Submit Dataset**:
   - On bounty detail modal, add "Submit Your Dataset" button
   - Opens submission form with:
     - Dropdown to select one of their existing datasets
     - Or option to "Create New Dataset" (opens creator form)
     - Notes field to explain why it fits the bounty
     - Submit button

3. **Track Submissions**:
   - Dashboard shows "My Bounty Submissions" section
   - Status: Pending, Approved, Rejected
   - Notifications when status changes

### **For Bounty Posters (Reviewing Submissions):**

1. **View Submissions**:
   - Dashboard shows "My Bounties" section
   - Each bounty shows submission count
   - Click to see all submissions

2. **Review Each Submission**:
   - See dataset preview (title, description, schema)
   - Submission notes from creator
   - Actions: Approve, Reject, or Request Changes

3. **Approve & Purchase**:
   - Click "Approve & Purchase"
   - Redirected to Stripe checkout for the dataset price
   - On successful payment:
     - Submission marked as "approved"
     - Bounty status changes to "in_progress" or "completed"
     - Creator gets paid (via normal Stripe Connect flow)
     - Dataset added to bounty poster's library

---

## Implementation Plan

### **Phase 1: Submission Flow** (Highest Priority)

#### 1.1: Add Submit Button to Bounty Modal
**File**: `src/pages/HomePage.jsx`

```jsx
// Inside bounty detail modal, after description
{user && (
  <div className="mt-6">
    <button
      onClick={() => setSubmissionBountyId(bounties[selectedBounty].id)}
      className="w-full bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-bold border-2 border-black rounded-full px-6 py-3 hover:opacity-90"
    >
      Submit Your Dataset to This Bounty
    </button>
  </div>
)}
```

#### 1.2: Create Submission Modal Component
**New File**: `src/components/BountySubmissionModal.jsx`

```jsx
export function BountySubmissionModal({ 
  isOpen, 
  onClose, 
  bountyId, 
  userDatasets 
}) {
  const [selectedDataset, setSelectedDataset] = useState(null)
  const [notes, setNotes] = useState('')
  
  const handleSubmit = async () => {
    // Insert into bounty_submissions table
    // Show success message
    // Close modal
  }
  
  return (
    // Modal with dropdown of user's datasets
    // Notes textarea
    // Submit button
  )
}
```

#### 1.3: Submission Handler
**Function**: Create submission in database

```javascript
const submitToBounty = async (bountyId, datasetId, notes) => {
  const { data, error } = await supabase
    .from('bounty_submissions')
    .insert([{
      bounty_id: bountyId,
      creator_id: user.id,
      dataset_id: datasetId,
      notes: notes,
      status: 'pending'
    }])
  
  if (error) throw error
  return data
}
```

---

### **Phase 2: Dashboard Integration**

#### 2.1: Add Bounty Tabs to Dashboard
**File**: `src/pages/DashboardPage.jsx`

Add new tabs:
- "My Bounties" (bounties user posted)
- "My Submissions" (datasets user submitted to bounties)

#### 2.2: Fetch User's Bounties
```javascript
const fetchMyBounties = async () => {
  const { data, error } = await supabase
    .from('bounties')
    .select(`
      *,
      bounty_submissions (
        id,
        status,
        dataset_id,
        datasets (title, price),
        profiles (username)
      )
    `)
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  setMyBounties(data)
}
```

#### 2.3: Fetch User's Submissions
```javascript
const fetchMySubmissions = async () => {
  const { data, error } = await supabase
    .from('bounty_submissions')
    .select(`
      *,
      bounties (title, budget),
      datasets (title, price)
    `)
    .eq('creator_id', user.id)
    .order('submitted_at', { ascending: false })
  
  if (error) throw error
  setMySubmissions(data)
}
```

---

### **Phase 3: Submission Review UI**

#### 3.1: Bounty Detail Page with Submissions
**Component**: Expandable section showing all submissions

```jsx
<div className="bg-white border-2 border-black rounded-xl p-4">
  <h5 className="font-extrabold text-lg mb-3">
    Submissions ({submissions.length})
  </h5>
  
  {submissions.map(submission => (
    <div key={submission.id} className="border-2 border-black rounded-lg p-4 mb-3">
      <div className="flex justify-between items-start">
        <div>
          <h6 className="font-bold">{submission.datasets.title}</h6>
          <p className="text-sm">By {submission.profiles.username}</p>
          <p className="text-sm text-black/70">{submission.notes}</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-green-400..." onClick={() => handleApprove(submission)}>
            Approve & Purchase
          </button>
          <button className="bg-red-400..." onClick={() => handleReject(submission)}>
            Reject
          </button>
        </div>
      </div>
    </div>
  ))}
</div>
```

#### 3.2: Approve & Purchase Flow
```javascript
const handleApproveSubmission = async (submission) => {
  // 1. Update submission status to 'approved'
  await supabase
    .from('bounty_submissions')
    .update({ status: 'approved' })
    .eq('id', submission.id)
  
  // 2. Initiate Stripe checkout for the dataset
  const dataset = submission.datasets
  setCheckoutIdx(/* dataset index */)
  
  // 3. After successful purchase, bounty gets marked as completed
}
```

---

### **Phase 4: Notifications & Status Updates**

#### 4.1: Submission Status Badges
- **Pending**: Yellow badge with clock icon
- **Approved**: Green badge with checkmark
- **Rejected**: Red badge with X icon

#### 4.2: Real-time Updates (Future)
- Use Supabase real-time subscriptions
- Notify when submission status changes
- Notify bounty poster when new submission received

---

## User Interface Mockups

### **Bounty Modal (Updated)**
```
┌────────────────────────────────────┐
│ (DEMO) Recordings of Rain ✕       │
├────────────────────────────────────┤
│ Audio Bounty                       │
│                                    │
│ Budget: $250  |  Quantity: 5 hours│
│                                    │
│ Description:                       │
│ Need high-quality audio...         │
│                                    │
│ [Submit Your Dataset to This      │
│  Bounty]                          │
└────────────────────────────────────┘
```

### **Submission Modal**
```
┌────────────────────────────────────┐
│ Submit to Bounty ✕                │
├────────────────────────────────────┤
│ Bounty: Recordings of Rain         │
│ Budget: $250                       │
│                                    │
│ Select Your Dataset:               │
│ [Dropdown: My Dataset 1 ▼]        │
│                                    │
│ Why does this fit?                 │
│ [Text area for notes...]          │
│                                    │
│ [Submit]  [Cancel]                │
└────────────────────────────────────┘
```

### **Dashboard - My Bounties Tab**
```
┌────────────────────────────────────┐
│ My Bounties                        │
├────────────────────────────────────┤
│ Recordings of Rain                 │
│ Budget: $250 | 3 submissions       │
│ [View Submissions]                 │
├────────────────────────────────────┤
│ Customer Support Chat Logs         │
│ Budget: $500 | 0 submissions       │
│ [View Submissions]                 │
└────────────────────────────────────┘
```

### **Dashboard - My Submissions Tab**
```
┌────────────────────────────────────┐
│ My Submissions                     │
├────────────────────────────────────┤
│ Rain Audio Collection              │
│ → Recordings of Rain bounty        │
│ Status: [Pending]                  │
├────────────────────────────────────┤
│ Support Chat Dataset               │
│ → Customer Support bounty          │
│ Status: [Approved ✓]              │
└────────────────────────────────────┘
```

---

## Technical Considerations

### **Preventing Duplicate Submissions**
Add unique constraint or check before insert:
```sql
-- Check if user already submitted this dataset to this bounty
SELECT id FROM bounty_submissions 
WHERE bounty_id = ? AND dataset_id = ?
```

### **Dataset Ownership Verification**
Only show user's own datasets in submission dropdown:
```javascript
const userDatasets = datasets.filter(d => d.creator_id === user.id)
```

### **Payment Flow**
When bounty poster approves submission:
1. Regular Stripe checkout for dataset
2. Creator gets paid via Connect (80%)
3. Platform takes 20%
4. Submission marked as approved
5. Dataset added to bounty poster's library

### **Bounty Status Management**
- **Active**: Accepting submissions
- **In Progress**: At least one submission approved
- **Completed**: Bounty poster satisfied, no more submissions needed
- **Cancelled**: Bounty poster cancelled

---

## Priority Recommendations

### **Must Have (MVP)**:
1. ✅ Submit dataset to bounty button
2. ✅ Submission modal with dataset selection
3. ✅ Dashboard tab showing "My Submissions"
4. ✅ Dashboard tab showing "My Bounties" with submission count

### **Should Have (Beta)**:
5. ✅ View all submissions for a bounty
6. ✅ Approve/reject submission buttons
7. ✅ Approve triggers purchase flow
8. ✅ Status badges and tracking

### **Nice to Have (V1)**:
9. Real-time notifications
10. Submission messaging/chat
11. Request changes workflow
12. Bounty expiration handling
13. Submission analytics

---

## Estimated Implementation Time

- **Phase 1 (Submission Flow)**: 4-6 hours
- **Phase 2 (Dashboard Integration)**: 3-4 hours
- **Phase 3 (Review UI)**: 4-6 hours
- **Phase 4 (Notifications)**: 2-3 hours

**Total MVP**: ~15-20 hours of development

---

## Current Gaps Summary

| Feature | Status | Priority |
|---------|--------|----------|
| Submit to bounty button | ❌ Missing | HIGH |
| Submission modal | ❌ Missing | HIGH |
| View submissions (bounty poster) | ❌ Missing | HIGH |
| Approve/reject UI | ❌ Missing | HIGH |
| Dashboard bounty management | ❌ Missing | MEDIUM |
| Notifications | ❌ Missing | LOW |
| Real-time updates | ❌ Missing | LOW |

---

## Next Steps

**Would you like me to implement:**
1. The complete bounty submission flow (Phase 1-3)?
2. Just the basic submission button and modal first?
3. Dashboard integration for bounty management?

Let me know which approach you prefer and I'll start building it out!
