# Pro Curator System - Complete Implementation Guide

## 🎯 Overview

The Pro Curator system creates a professional marketplace for dataset curation partnerships, enabling data owners to collaborate with certified experts on a 50/50 revenue split model.

## 🏗️ System Architecture

### Database Schema (Migration 008)

#### 1. **pro_curators** Table
Stores professional curator profiles and certification status.

**Columns:**
- `user_id` (uuid, FK to auth.users)
- `display_name` (text) - Public curator name
- `bio` (text) - Professional background
- `specialties` (text[]) - Array of expertise areas
- `hourly_rate` (decimal) - Optional hourly rate
- `certification_status` ('pending', 'approved', 'rejected')
- `badge_level` ('verified', 'expert', 'master')
- `rating` (decimal) - Average rating from partnerships
- `total_projects` (integer) - Completed partnerships count
- `total_earnings` (decimal) - Lifetime curator earnings
- `portfolio_samples` (text[]) - URLs to previous work
- `created_at`, `updated_at` (timestamps)

**Badge Levels:**
- **Verified** (default): Newly approved curator
- **Expert**: 10+ projects, 4.5+ rating (auto-upgraded by trigger)
- **Master**: 50+ projects, 4.8+ rating (auto-upgraded by trigger)

#### 2. **curation_requests** Table
Data owners post curation needs here.

**Columns:**
- `id` (uuid, primary key)
- `creator_id` (uuid, FK to auth.users)
- `title` (text) - Request title
- `description` (text) - Detailed requirements
- `target_quality` ('basic', 'standard', 'premium')
- `budget_min`, `budget_max` (decimal) - Optional price range
- `specialties_needed` (text[]) - Required expertise
- `status` ('open', 'in_progress', 'completed', 'cancelled')
- `assigned_curator_id` (uuid) - Curator who won the bid
- `created_at`, `updated_at` (timestamps)

#### 3. **curator_proposals** Table
Curators submit bids on requests.

**Columns:**
- `id` (uuid, primary key)
- `request_id` (uuid, FK to curation_requests)
- `curator_id` (uuid, FK to auth.users)
- `proposal_text` (text) - Curator's approach and pitch
- `estimated_completion_days` (integer)
- `suggested_price` (decimal) - Proposed dataset price
- `portfolio_samples` (text[]) - Relevant work examples
- `status` ('pending', 'accepted', 'rejected')
- `created_at` (timestamp)

#### 4. **dataset_partnerships** Table
Active collaborations between data owner and curator.

**Columns:**
- `id` (uuid, primary key)
- `dataset_id` (uuid, FK to datasets)
- `owner_id` (uuid) - Original data owner
- `curator_user_id` (uuid) - Pro Curator partner
- `split_percentage` (integer, default 50) - Curator's % of creator share
- `status` ('active', 'completed', 'terminated')
- `total_sales` (integer) - Number of purchases
- `owner_earnings`, `curator_earnings` (decimal) - Tracked earnings
- `started_at`, `ended_at` (timestamps)

**Indexes:**
- `dataset_id` (for fast lookup during purchases)
- `owner_id`, `curator_user_id` (for user dashboards)

### Revenue Model

```
Sale Price: $100
├─ Platform Fee (20%): $20
└─ Creator Share (80%): $80
   ├─ Owner Earnings (50% of $80): $40
   └─ Curator Earnings (50% of $80): $40
```

**No Partnership:**
- Platform: 20%
- Creator: 80%

**With Partnership:**
- Platform: 20%
- Data Owner: 40%
- Pro Curator: 40%

### Automated Systems

#### Trigger: update_curator_stats_on_partnership()
**Fires:** After INSERT on dataset_partnerships
**Action:** Increments pro_curators.total_projects by 1

#### Trigger: update_curator_badge_level()
**Fires:** After UPDATE on pro_curators (when total_projects or rating changes)
**Logic:**
```sql
IF total_projects >= 50 AND rating >= 4.8 THEN
  badge_level = 'master'
ELSIF total_projects >= 10 AND rating >= 4.5 THEN
  badge_level = 'expert'
ELSE
  badge_level = 'verified'
END
```

#### Trigger: update_partnership_earnings()
**Fires:** After INSERT on creator_earnings (when is_partnership_split = true)
**Action:** Updates partnership's total_sales, owner_earnings, curator_earnings

## 🔐 Row Level Security (RLS)

### pro_curators Policies
1. **Public can view approved curators**
   ```sql
   SELECT WHERE certification_status = 'approved'
   ```
2. **Users can view their own profile (any status)**
   ```sql
   SELECT WHERE user_id = auth.uid()
   ```
3. **Users can create their own profile**
   ```sql
   INSERT WHERE user_id = auth.uid()
   ```
4. **Users can update their own profile**
   ```sql
   UPDATE WHERE user_id = auth.uid()
   ```

### curation_requests Policies
1. **Public can view open/in_progress requests**
   ```sql
   SELECT WHERE status IN ('open', 'in_progress')
   ```
2. **Creators can view their own requests**
   ```sql
   SELECT WHERE creator_id = auth.uid()
   ```
3. **Users can create requests**
   ```sql
   INSERT WHERE creator_id = auth.uid()
   ```
4. **Creators can update their own requests**
   ```sql
   UPDATE WHERE creator_id = auth.uid()
   ```

### curator_proposals Policies
1. **Request creators can view proposals for their requests**
   ```sql
   SELECT WHERE request_id IN (SELECT id FROM curation_requests WHERE creator_id = auth.uid())
   ```
2. **Curators can view their own proposals**
   ```sql
   SELECT WHERE curator_id = auth.uid()
   ```
3. **Curators can create proposals**
   ```sql
   INSERT WHERE curator_id = auth.uid()
   ```

### dataset_partnerships Policies
1. **Public can view active partnerships**
   ```sql
   SELECT WHERE status = 'active'
   ```
2. **Partners can view their own partnerships**
   ```sql
   SELECT WHERE owner_id = auth.uid() OR curator_user_id = auth.uid()
   ```

## 💰 Payment Logic (Stripe Webhook)

### File: netlify/functions/stripe-webhook.js

**Modified checkout.session.completed handler:**

```javascript
// Calculate creator earnings
const totalAmount = parseFloat(purchase.amount)
const platformFee = totalAmount * 0.20  // 20% platform fee
const creatorNet = totalAmount - platformFee  // 80% creator share

// Check for active partnership
const { data: partnership } = await supabase
  .from('dataset_partnerships')
  .select('*')
  .eq('dataset_id', datasetId)
  .eq('status', 'active')
  .single()

if (partnership) {
  // Split 50/50 between owner and curator
  const splitPercentage = partnership.split_percentage / 100
  const ownerNet = creatorNet * splitPercentage
  const curatorNet = creatorNet * (1 - splitPercentage)

  // Create TWO earnings records
  // 1. Owner earnings
  INSERT creator_earnings {
    creator_id: partnership.owner_id,
    creator_net: ownerNet,
    partnership_id: partnership.id,
    is_partnership_split: true,
    split_role: 'owner'
  }
  
  // 2. Curator earnings
  INSERT creator_earnings {
    creator_id: partnership.curator_user_id,
    creator_net: curatorNet,
    partnership_id: partnership.id,
    is_partnership_split: true,
    split_role: 'curator'
  }

  // Update BOTH payout accounts
  UPDATE creator_payout_accounts (owner)
  UPDATE creator_payout_accounts (curator)

  // Update partnership stats (done by trigger)
} else {
  // Original flow: single creator gets full 80%
  INSERT creator_earnings (no partnership fields)
  UPDATE creator_payout_accounts (creator only)
}
```

## 🎨 Frontend Components

### 1. ProCuratorProfile.jsx (466 lines)

**Purpose:** Certification application and profile management

**Features:**
- **Application Form:** New curators apply for certification
  - Display name, bio, specialties (checkboxes)
  - Hourly rate (optional)
  - Portfolio samples (dynamic array)
- **Profile View:** Shows badge, stats, specialties, portfolio
- **Edit Mode:** Update profile fields (approved curators only)
- **Stats Display:** Total projects, rating, earnings, hourly rate

**States:**
- `certification_status === null`: Show application form
- `certification_status === 'pending'`: Show profile with "Pending Review" badge
- `certification_status === 'approved'`: Full profile with edit button
- `certification_status === 'rejected'`: Show rejection status

**Badge Display:**
```jsx
const badgeColors = {
  verified: 'bg-blue-100 text-blue-800',
  expert: 'bg-purple-100 text-purple-800',
  master: 'bg-yellow-100 text-yellow-800'
}
```

### 2. CurationRequestModal.jsx (245 lines)

**Purpose:** Data owners post curation needs

**Form Fields:**
- **Title** (required): e.g., "Need 5,000 medical images annotated"
- **Description** (required): Detailed requirements, quality standards, timeline
- **Target Quality** (required): basic/standard/premium dropdown
- **Specialties Needed** (required): Checkbox list (min 1)
- **Budget Range** (optional): Min/max dollar inputs

**Flow:**
1. User clicks "Request Curation" in Dashboard
2. Modal opens with form
3. On submit: INSERT into curation_requests (status='open')
4. Modal closes, callback refreshes data
5. Request appears on CurationRequestBoard

### 3. CurationRequestBoard.jsx (227 lines)

**Purpose:** Marketplace for curators to browse opportunities

**Features:**
- **Filters:**
  - Status: all / open / in_progress
  - Specialty: dropdown of all types
- **Request Cards:**
  - Title, poster name, time ago
  - Quality badge, status badge
  - Description preview (line-clamp-2)
  - Specialties tags
  - Budget range, proposal count
  - "Submit Proposal" button
- **Empty State:** Friendly message when no requests match

**Data Fetching:**
```javascript
supabase
  .from('curation_requests')
  .select(`
    *,
    profiles:creator_id (username),
    curator_proposals(count)
  `)
  .in('status', ['open', 'in_progress'])
```

### 4. Pro Badge on Dataset Cards

**HomePage.jsx & DashboardPage.jsx modifications:**

**Query Change:**
```javascript
.select(`
  *,
  profiles:creator_id (username, full_name),
  dataset_partnerships!dataset_partnerships_dataset_id_fkey (
    id,
    curator_user_id,
    pro_curators!dataset_partnerships_curator_user_id_fkey (
      display_name,
      badge_level
    )
  )
`)
.eq('dataset_partnerships.status', 'active')
```

**Badge Display:**
```jsx
{dataset.dataset_partnerships?.[0]?.pro_curators && (
  <div className="mt-2 flex items-center gap-2">
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border-2 ${badgeColors[badge_level]}`}>
      <Star className="w-3 h-3 mr-1 fill-current" />
      PRO CURATOR
    </span>
    <span className="text-xs font-semibold text-black/70">
      by {display_name}
    </span>
  </div>
)}
```

## 📋 Certification Process

### Manual Approval (MVP)
1. Curator submits application via ProCuratorProfile
2. Record created with `certification_status = 'pending'`
3. Platform admin reviews manually in Supabase
4. Admin updates: `certification_status = 'approved'` or `'rejected'`
5. Curator sees status change on profile page

### Automatic Badge Upgrades
- **Verified → Expert:** Trigger fires when curator hits 10 projects + 4.5 rating
- **Expert → Master:** Trigger fires when curator hits 50 projects + 4.8 rating

## 🔄 Partnership Lifecycle

### Phase 1: Request Creation
1. Data owner clicks "Request Curation" button
2. Fills CurationRequestModal form
3. Request inserted into curation_requests (status='open')
4. Appears on CurationRequestBoard

### Phase 2: Proposal Submission (TODO)
1. Curator views request on marketplace board
2. Clicks "Submit Proposal"
3. Fills proposal form (approach, timeline, price, portfolio)
4. Proposal inserted into curator_proposals (status='pending')
5. Data owner sees proposal count on request card

### Phase 3: Proposal Acceptance (TODO)
1. Data owner reviews proposals
2. Accepts one proposal
3. System creates:
   - dataset_partnerships record (status='active')
   - Updates curation_request (status='in_progress', assigned_curator_id)
   - Updates accepted proposal (status='accepted')
   - Rejects other proposals (status='rejected')

### Phase 4: Revenue Splitting (IMPLEMENTED)
1. Customer purchases dataset
2. Stripe webhook detects partnership
3. Splits 80% creator share → 40% owner + 40% curator
4. Creates two creator_earnings records
5. Updates both payout accounts
6. Triggers update partnership stats

## 🎯 Current Implementation Status

### ✅ Completed (Tasks 1-5)
1. **Database Schema** - 4 tables, RLS, triggers (340 lines SQL)
2. **Stripe Webhook** - Partnership revenue splitting (150 lines)
3. **ProCuratorProfile** - Application, profile, stats (466 lines)
4. **Pro Badges** - Display on HomePage & Dashboard cards
5. **Curation Request System** - Modal & marketplace board (472 lines)

### 🔄 In Progress (Task 6)
6. **Proposal System** - Submission, review, acceptance workflow

### ⏳ Pending (Tasks 7-8)
7. **Pro Curator Dashboard Tab** - Stats, partnerships, earnings
8. **Certification System** - (Currently manual, admin approves in DB)

## 🚀 Next Steps

### Immediate (Complete Proposal System)
1. Create ProposalModal component
2. Add proposal list view for request creators
3. Implement accept/reject buttons
4. Create partnership on proposal acceptance
5. Update request and proposal statuses

### Short-term (Dashboard Tab)
1. Add "Pro Curator" tab to DashboardPage
2. Show certification status
3. List active partnerships with earnings breakdown
4. Display curation requests feed
5. Show proposals submitted/pending

### Long-term (Enhancements)
1. Rating system (after partnership completion)
2. Dispute resolution
3. Partnership termination flow
4. Portfolio showcase page
5. Curator search/filter
6. Direct messaging between partners

## 📊 Key Metrics to Track

### Curator Performance
- Total projects completed
- Average rating
- Total earnings
- Response time on proposals
- Acceptance rate

### Platform Health
- Active partnerships
- Partnership revenue (20% of sales from curated datasets)
- Curator retention rate
- Average time from request → partnership
- Quality of curated datasets (ratings, sales)

## 🔒 Security Considerations

1. **RLS Policies:** All tables protected, users can only access own data or public data
2. **Stripe Webhook:** Verified signature before processing
3. **Partnership Creation:** Only through proposal acceptance (prevent unauthorized splits)
4. **Earnings Tracking:** Immutable creator_earnings records (audit trail)
5. **Profile Visibility:** Only approved curators visible to public

## 📝 Specialty Types Reference

```javascript
specialtyOptions = [
  'handwritten_text',    // OCR, handwriting recognition
  'audio_transcription', // Speech-to-text, audio labeling
  'video_annotation',    // Frame labeling, action recognition
  'image_labeling',      // Object detection, segmentation
  'text_classification', // NLP, sentiment, categorization
  'sensor_data',         // IoT, time-series, signal processing
  'financial_data',      // Trading, risk, financial modeling
  'medical_imaging'      // X-rays, MRI, diagnostic imaging
]
```

## 🎨 UI/UX Design Patterns

### Color Scheme
- **Primary:** Indigo-600 (buttons, links)
- **Accent:** Yellow-300, Pink-300 (headers, highlights)
- **Success:** Green-400 (badges, confirmations)
- **Warning:** Yellow-100 (pending states)
- **Danger:** Red-300 (delete, reject)

### Typography
- **Headers:** font-extrabold, uppercase
- **Body:** font-semibold
- **Cards:** border-2 or border-4 border-black
- **Shadows:** shadow-[8px_8px_0_#000] (neo-brutalism style)

### Badge Styling
```jsx
verified: 'bg-blue-100 text-blue-800 border-blue-800'
expert:   'bg-purple-100 text-purple-800 border-purple-800'
master:   'bg-yellow-100 text-yellow-800 border-yellow-800'
```

## 📞 Support & Maintenance

### Common Issues
1. **Partnership not splitting payments:** Check dataset_partnerships.status = 'active'
2. **Badge not showing:** Verify curator_user_id in partnership exists
3. **Proposals not visible:** Check RLS policies on curator_proposals
4. **Badge not auto-upgrading:** Verify triggers are enabled in Supabase

### Database Maintenance
```sql
-- Check partnership health
SELECT * FROM dataset_partnerships WHERE status = 'active';

-- Verify earnings splits
SELECT * FROM creator_earnings WHERE is_partnership_split = true;

-- Curator performance
SELECT 
  user_id, 
  display_name, 
  badge_level, 
  total_projects, 
  rating 
FROM pro_curators 
WHERE certification_status = 'approved'
ORDER BY total_projects DESC;
```

---

**System Version:** 1.0.0  
**Last Updated:** January 2025  
**Migration:** 008_pro_curator_system.sql  
**Status:** Phase 1 MVP (Tasks 1-5 complete)
