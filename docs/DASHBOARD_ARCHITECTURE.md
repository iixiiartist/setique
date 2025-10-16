# Dashboard Architecture Documentation

**Last Updated:** Phase 1 Cleanup (January 2025)  
**Files Covered:** `DashboardPage.jsx` (2,876 lines), `AdminDashboard.jsx` (2,047 lines)

## Overview

The SETIQUE platform has two primary dashboard interfaces:
- **User Dashboard** (`DashboardPage.jsx`): For creators, buyers, and curators
- **Admin Dashboard** (`AdminDashboard.jsx`): For platform administrators

Both dashboards are monolithic components with significant complexity that will be refactored in subsequent phases.

---

## DashboardPage.jsx Architecture

### Component Stats
- **Total Lines:** 2,876
- **State Variables:** 42+
- **Modal States:** 9
- **Tab Views:** 6 (Datasets, Purchases, Earnings, Bounties, Curation Requests, Favorites)
- **Major Features:** Dataset management, Bounty system, Curation requests, Stripe Connect, Purchases

### State Management

#### Modal States (9 total)
```javascript
uploadModalOpen              // Dataset upload
curationRequestModalOpen     // New curation request
proposalsModalOpen          // View proposals for request
proposalSubmissionOpen      // Submit proposal as curator
bountySubmissionOpen        // Submit dataset to bounty
submissionModalOpen         // Curator submission to request
confirmDialog               // Generic confirmation
deleteConfirm               // Dataset deletion confirmation
editingDataset             // Dataset editing modal
```

**Phase 2 Goal:** Consolidate into `useModalState` hook

#### Data States (Core)
```javascript
// Curator/Creator Data
myDatasets                  // User's created datasets
earnings                   // Earnings summary & transactions
payoutAccount             // Stripe Connect account info

// Buyer Data
myPurchases               // Completed purchases
myFavorites              // Favorited datasets

// Bounty Data
myBounties               // Created bounties
mySubmissions           // Submitted datasets to bounties
expandedBounty         // UI state for expanded bounty

// Curation Request Data
myCurationRequests            // Created requests
selectedRequest              // Currently selected request
openCurationRequests         // Available requests for curators
curatorProfile              // Curator certification info
curatorAssignedRequests     // Requests assigned to curator
```

#### UI States
```javascript
activeTab                // Current tab view
loading                 // Global loading state
mobileMenuOpen         // Mobile menu state
actionLoading         // Action-specific loading
connectingStripe     // Stripe Connect loading
connectError        // Stripe Connect error
```

#### Admin States
```javascript
isAdmin                    // Admin access flag
hasModerationAccess       // Moderation permission flag
```

### Data Flow

#### Initial Load (fetchDashboardData)
```
1. Check user authentication
2. Parallel fetch (Batch 1):
   - User's datasets (with partnerships)
   - Creator earnings
   - Payout account
   - Purchases
   - Admin status
   - Favorites
3. Parallel fetch (Batch 2):
   - Bounties (curation requests)
   - Bounty submissions
   - Curator proposals
   - Open curation requests
4. Parallel fetch (Batch 3):
   - Curator profile
   - Assigned requests
5. Process and set all state variables
```

**Current Performance:** ~5-7 queries in parallel batches  
**Phase 6 Goal:** Extract into `useDashboardData` custom hook

#### Stripe Connect Flow
```
1. User clicks "Connect Stripe"
2. Create onboarding URL via Netlify function
3. Redirect to Stripe
4. Return with ?onboarding=complete
5. Verify account status via API
6. Update payout account state
```

#### Dataset Purchase Flow (via lib/checkout.js)
```
1. Call handleDatasetCheckout()
2. Check existing purchase
3. Free dataset: Direct insert to purchases
4. Paid dataset: Create Stripe checkout session
5. Refresh purchases after success
```

### Event Handlers

#### Dataset Management
- `handleDatasetDelete()` - Delete dataset with confirmation
- `handleDatasetUpdate()` - Update dataset metadata
- Dataset edit modal open/close handlers

#### Bounty Management
- `handleDeleteSubmission()` - Delete bounty submission
- Bounty expansion toggle
- Bounty creation modal handlers

#### Curation Requests
- Proposal submission handlers
- Request selection handlers
- Curator submission handlers

#### Stripe Connect
- `handleConnectStripe()` - Initiate onboarding
- Account verification on return

### Component Structure

```
DashboardPage
├── Header (with mobile menu)
├── Tab Navigation (6 tabs)
├── Tab Content
│   ├── Datasets Tab
│   │   ├── Dataset grid
│   │   └── Dataset cards with actions
│   ├── Purchases Tab
│   │   └── Purchase history
│   ├── Earnings Tab
│   │   ├── Stats overview
│   │   ├── Stripe Connect section
│   │   └── Transactions list
│   ├── Bounties Tab
│   │   ├── My Bounties (created)
│   │   └── My Submissions
│   ├── Curation Requests Tab
│   │   ├── My Requests (creator view)
│   │   ├── Available Requests (curator view)
│   │   └── Assigned Requests (curator view)
│   └── Favorites Tab
└── Modals (9 total)
    ├── DatasetUploadModal
    ├── CurationRequestModal
    ├── ProposalsModal
    ├── ProposalSubmissionModal
    ├── BountySubmissionModal
    ├── CuratorSubmissionModal
    ├── ConfirmDialog
    ├── DeleteConfirmDialog
    └── DatasetEditModal
```

**Phase 3 Goal:** Extract tab panels into separate components  
**Phase 5 Goal:** Extract modals into separate components

---

## AdminDashboard.jsx Architecture

### Component Stats
- **Total Lines:** 2,047
- **State Variables:** 20+
- **Modal States:** 3
- **Tab Views:** Multiple admin sections
- **Major Features:** User management, Dataset moderation, Bounty oversight, Revenue tracking

### State Management

#### Modal States (3 total)
```javascript
showUserModal          // User detail modal
showBountyModal       // Bounty detail modal
confirmDialog        // Generic confirmation
rejectingRequest    // Deletion request rejection state
```

**Phase 2 Goal:** Consolidate into `useModalState` hook

#### Data States (Core)
```javascript
// Users
allUsers                  // All platform users
selectedUser             // User detail view

// Curators
allCurators              // All Pro Curators
pendingCurators         // Pending certifications

// Datasets
allDatasets             // All platform datasets

// Activity
activityLog            // Platform activity log

// Deletion Requests
deletionRequests       // Dataset deletion requests
adminResponse         // Response text for rejections

// Bounties
allBounties              // All curation requests
selectedBounty          // Bounty detail view
allBountySubmissions   // All bounty submissions

// Stats
stats                   // Platform-wide statistics
  ├── totalUsers
  ├── totalDatasets
  ├── totalCurators
  ├── pendingCurators
  ├── totalRevenue
  ├── platformRevenue
  ├── creatorRevenue
  ├── totalTransactions
  ├── totalBounties
  ├── openBounties
  ├── assignedBounties
  ├── completedBounties
  ├── pendingModeration
  ├── flaggedDatasets
  └── pendingReports
```

#### UI States
```javascript
loading               // Global loading state
isAdmin              // Admin verification flag
```

### Data Flow

#### Initial Load (fetchAdminData)
```
1. Check admin authentication
2. Parallel fetch (Batch 1):
   - All curators
   - All users
   - All datasets
   - Revenue stats
   - Activity log
3. Sequential fetch:
   - Bounties (curation requests)
   - Bounty submissions
   - Deletion requests
   - Flagged datasets
   - Reports
   - Moderation stats
4. Calculate and set stats
```

**Current Performance:** Multiple admin API calls via Netlify functions  
**Phase 6 Goal:** Extract into `useAdminData` custom hook

#### Admin Actions Flow
```
All admin actions go through:
/.netlify/functions/admin-actions

Actions:
- delete_dataset
- approve_deletion_request
- reject_deletion_request
- delete_bounty_submission
- approve_bounty_submission
- certify_curator
- ban_user
- etc.
```

### Event Handlers

#### User Management
- User selection and detail view
- User banning/unbanning
- Trust level management (via TrustLevelManager component)

#### Dataset Management
- Dataset approval/rejection
- Dataset deletion (with purchase cascade)
- Deletion request handling

#### Curator Management
- Curator certification approval/rejection
- Badge level management

#### Bounty Management
- Bounty submission deletion
- Bounty submission approval
- Bounty detail view

#### Beta Access Management
- Beta invite code generation
- Access management (via BetaAccessManagement component)

### Component Structure

```
AdminDashboard
├── Admin Check & Auth
├── Stats Overview
├── Tab/Section Navigation
├── Admin Sections
│   ├── User Management
│   │   └── User list with actions
│   ├── Curator Management
│   │   ├── All curators
│   │   └── Pending certifications
│   ├── Dataset Moderation
│   │   └── Dataset grid with approve/reject
│   ├── Deletion Requests
│   │   └── Request list with approve/reject
│   ├── Bounty Oversight
│   │   ├── All bounties
│   │   └── Bounty submissions
│   ├── Activity Log
│   │   └── Platform activity stream
│   ├── Revenue Dashboard
│   │   └── Financial stats
│   └── Beta Access Management
│       └── Invite code management
├── Sub-Components
│   ├── TrustLevelManager
│   ├── FeedbackManagement
│   ├── BetaAccessManagement
│   └── AdminReviewPanel
└── Modals (3 total)
    ├── UserDetailModal
    ├── BountyDetailModal
    └── ConfirmDialog
```

**Phase 3 Goal:** Extract admin sections into separate components

---

## Common Patterns

### Error Handling (Current State)
- Inconsistent try-catch blocks
- Some use `console.error()`, some use `alert()`
- Limited error boundaries
- No centralized error logging

**Phase 4 Goal:** Standardize error handling with consistent patterns

### Loading States (Current State)
- Global `loading` state for initial load
- Some action-specific loading states (`actionLoading`, `connectingStripe`)
- Not all async operations show loading state

**Phase 4 Goal:** Add comprehensive loading states for all async operations

### Validation (Current State)
- Basic form validation in modals
- Limited input sanitization
- No centralized validation utilities

**Phase 4 Goal:** Add comprehensive validation layer

### Data Fetching (Current State)
- Direct Supabase calls in component
- Some optimizations (parallel fetches, batch queries)
- Mix of Supabase direct + Netlify functions

**Phase 6 Goal:** Extract into custom hooks (useDashboardData, useAdminData)

---

## Refactoring Roadmap

### ✅ Phase 1: Cleanup & Documentation (CURRENT)
- Remove debug console.log statements
- Add TODO comments for future phases
- Document current architecture
- **Status:** Complete

### Phase 2: Modal State Consolidation (1-2 hours)
- Create `lib/hooks/useModalState.js`
- Replace 9 modal states in DashboardPage
- Replace 3 modal states in AdminDashboard
- Test all modal interactions

### Phase 3: Component Extraction - Tab Panels (3-4 hours)
- Extract 6 tab panels from DashboardPage
- Extract admin sections from AdminDashboard
- Props interface design
- Event handler passing

### Phase 4: Error Handling & Validation (2-3 hours)
- Create error handling utilities
- Standardize error messages
- Add validation layer
- Implement error boundaries

### Phase 5: Modal Component Extraction (3-4 hours)
- Extract 9 modals from DashboardPage
- Extract 3 modals from AdminDashboard
- Reusable modal base component

### Phase 6: Custom Hooks - Data Fetching (3-4 hours)
- Create `useDashboardData` hook
- Create `useAdminData` hook
- Create `useDatasetActions` hook
- Create `useBountyManagement` hook

### Phase 7: Performance Optimization (2-3 hours)
- Memoization with `useMemo`/`useCallback`
- Virtual scrolling for long lists
- Image lazy loading
- Code splitting

### Phase 8: Testing & Documentation (2-3 hours)
- Update test suite
- Integration tests for refactored code
- Update component documentation
- Performance benchmarks

---

## Dependencies

### External Libraries
- React (useState, useEffect, useCallback)
- Supabase (database client)
- Stripe (payment processing)
- React Router (navigation)

### Internal Dependencies
- `lib/checkout.js` - Shared checkout logic (Phase 2 refactoring)
- `contexts/AuthContext.js` - Authentication state
- `lib/supabase.js` - Supabase client
- `lib/activityTracking.js` - Activity logging
- `lib/logger.js` - Error logging

### Netlify Functions
- `admin-actions` - Admin operations
- `connect-onboarding` - Stripe Connect
- `verify-stripe-account` - Account verification
- `create-stripe-checkout` - Payment sessions

---

## Performance Considerations

### Current Issues
1. **Large bundle size:** Monolithic components (~5,000 lines total)
2. **Unnecessary re-renders:** 42+ state variables trigger re-renders
3. **No code splitting:** All code loaded upfront
4. **No memoization:** Computed values recalculated on every render

### Phase 7 Optimizations
1. Code splitting by tab
2. Memoize expensive computations
3. Virtual scrolling for datasets/bounties
4. Lazy load images
5. Debounce search/filter inputs

---

## Security Considerations

### Row-Level Security (RLS)
- Most queries use RLS policies in Supabase
- Admin operations bypass RLS via service role key
- Deletion checks for ownership (user.id matching)

### Admin Verification
- Both dashboards check admin status on load
- AdminDashboard redirects non-admins
- Admin actions require admin verification

### Data Validation
- Limited client-side validation
- Server-side validation in Netlify functions
- **Phase 4:** Add comprehensive validation layer

---

## Known Issues

### Technical Debt
1. **Monolithic components:** 2,876 and 2,047 lines respectively
2. **42+ state variables:** Too many for single component
3. **No error boundaries:** Errors can crash entire dashboard
4. **Inconsistent patterns:** Error handling, loading states vary
5. **Limited testing:** Complex interactions not fully covered

### Functionality Gaps
1. **No optimistic updates:** Some actions don't update UI immediately
2. **Limited pagination:** Large lists load all data at once
3. **No search/filter:** Difficult to find specific items in lists
4. **Mobile UX:** Some features cramped on mobile

### Future Enhancements
1. Real-time updates via Supabase subscriptions
2. Advanced filtering and search
3. Bulk actions for admin operations
4. Export/import functionality
5. Analytics and insights dashboard

---

## Testing Strategy

### Current Coverage
- 95 tests passing
- Focus on critical paths (checkout, purchases)
- Limited component-level testing

### Phase 8 Testing Goals
1. Component tests for extracted components
2. Integration tests for data flows
3. E2E tests for critical user journeys
4. Performance benchmarks
5. Accessibility testing

---

## Conclusion

Both dashboards are feature-rich but suffer from monolithic architecture. The 8-phase refactoring plan will systematically improve:

1. **Maintainability:** Smaller, focused components
2. **Testability:** Isolated units easier to test
3. **Performance:** Code splitting, memoization, optimization
4. **Developer Experience:** Clear patterns, good documentation
5. **User Experience:** Better error handling, loading states

Each phase is independently testable and brings immediate value.
