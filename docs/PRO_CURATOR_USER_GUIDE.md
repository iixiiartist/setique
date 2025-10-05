# Pro Curator System - User Journey Guide

## 🎯 Where to Find Pro Curator Features on the Site

### 1. **Homepage** (/)

#### Pro Curator Landing Section
**Location:** Scroll down to "Pro Curator Program" section (or click "Pro Curator" in nav)

**What users see:**
- **Gradient header** with star icons: "Pro Curator Program"
- **Tagline:** "Partner with data owners, apply your expertise, and earn 50/50 revenue splits"
- **3 value propositions:**
  - Expert Recognition (badges: Verified → Expert → Master)
  - Fair Revenue Split (40% of every sale)
  - Choose Your Projects (browse & propose)
- **How It Works** (4 steps):
  1. Apply for Certification
  2. Browse Opportunities
  3. Submit Proposals
  4. Earn Passively
- **Specialties grid** (8 types with emojis):
  - Handwritten Text, Audio Transcription, Video Annotation, Image Labeling
  - Text Classification, Sensor Data, Financial Data, Medical Imaging
- **CTA buttons:**
  - If logged in: "Apply to Become a Pro Curator" → Dashboard Pro Curator tab
  - If logged in: "Browse Curation Requests" → /marketplace
  - If not logged in: "Sign In to Apply" → Sign in modal

**Navigation:**
- Header nav has "Pro Curator" button (replaced "Become a Curator")
- Clicking scrolls to `#pro-curator` section

---

### 2. **Dashboard** (/dashboard?tab=pro-curator)

#### Pro Curator Tab
**Location:** New tab button in dashboard with star icon: "★ Pro Curator"

**Features:**

##### For New Users (Not Yet Certified):
**Certification Application Form:**
- Display Name (text input)
- Bio (textarea - professional background)
- Specialties (checkboxes - select at least one):
  - handwritten_text
  - audio_transcription
  - video_annotation
  - image_labeling
  - text_classification
  - sensor_data
  - financial_data
  - medical_imaging
- Portfolio Samples (dynamic URL inputs with add/remove)
- "Apply for Certification" button → Submits with `pending` status

##### For Existing Curators (Certified):
**Profile Dashboard:**
- Header with badge (Verified/Expert/Master) and certification status
- **Stats Grid** (3 boxes):
  - Total Projects
  - Rating (1-5 stars)
  - Total Earnings ($)
- **Edit Profile** button (top right)
- **Specialties** (colored tags)
- **Portfolio** (clickable links)

**Edit Mode:**
- Same form as application
- Can update all fields except certification status
- "Save Changes" / "Cancel" buttons

#### Curation Request Modal
**Location:** Button at top of Pro Curator tab: "Request Curation Help"

**Form Fields:**
- Request Title* (e.g., "Need 5,000 medical images annotated")
- Detailed Description* (requirements, quality standards, timeline)
- Target Quality Level*:
  - Basic - Quick cleaning, basic labels
  - Standard - Thorough cleaning, detailed annotations
  - Premium - Expert-level curation, research-grade quality
- Specialties Needed* (checkboxes, at least one)
- Budget Range (optional):
  - Min budget ($)
  - Max budget ($)
- "How it works" info box (5 steps)
- "Post Curation Request" button

**After Submission:**
- Request appears on /marketplace board
- Status: `open`
- Other curators can see it and submit proposals

---

### 3. **Marketplace** (/marketplace)

#### Curation Request Board
**What users see:**
- Header: "Curation Marketplace"
- Subtitle: "Browse curation requests from data owners and submit proposals to earn 50/50 revenue splits"
- **Filters:**
  - Status: All / Open / In Progress
  - Specialty: Dropdown of all 8 types
- **Request Cards** (each shows):
  - Title (bold, large)
  - Posted by username • Time ago
  - Quality badge (Basic/Standard/Premium)
  - Status badge (Open/In Progress)
  - Description preview (2 lines max)
  - Specialties tags (colored pills)
  - Budget range (if provided)
  - Proposal count (e.g., "📝 3 proposals")
  - "Submit Proposal" button (future: opens proposal modal)
- **Empty state:** "No requests found" with helpful message

**User Actions:**
- Browse all open/in-progress requests
- Filter by specialty or status
- Click "Submit Proposal" (Phase 2 - coming soon!)
- Back to Home button (top left)

---

## 🎬 Complete User Journeys

### Journey 1: Becoming a Pro Curator

1. **Land on homepage** → See "Pro Curator Program" section
2. **Read about benefits:**
   - Earn 40% of all sales (50/50 split with data owner)
   - Get certified badges as you complete projects
   - Choose projects that match your expertise
3. **Click "Apply to Become a Pro Curator"**
   - If not signed in: redirected to sign in modal
   - If signed in: taken to Dashboard Pro Curator tab
4. **Fill application:**
  - Professional name, bio, specialties
  - Portfolio links (optional)
5. **Submit** → `certification_status = 'pending'`
6. **Wait for admin approval** in Supabase
7. **Admin approves** → `certification_status = 'approved'`
8. **User returns** → Profile shows badge + stats

### Journey 2: Data Owner Requesting Help

1. **Logged in to Dashboard**
2. **Click "Pro Curator" tab** (star icon)
3. **Click "Request Curation Help"** button
4. **Fill curation request modal:**
   - Title: "Need 10,000 handwritten forms digitized"
   - Description: Detailed requirements
   - Quality: Premium
   - Specialties: handwritten_text
   - Budget: $5,000 - $10,000
5. **Submit** → Request posted to marketplace
6. **Pro Curators see request** on /marketplace
7. **Curators submit proposals** (Phase 2)
8. **Data owner reviews proposals** (Phase 2)
9. **Accept proposal** → Partnership created
10. **Dataset sold** → Automatic 50/50 split!

### Journey 3: Curator Finding Work

1. **Certified Pro Curator logs in**
2. **Click "Browse Curation Requests"** from homepage
3. **Lands on /marketplace**
4. **Filters by specialty** (e.g., "audio_transcription")
5. **Sees open requests**:
   - "Need 1,000 podcast episodes transcribed"
   - Budget: $2,000 - $3,000
   - Quality: Standard
6. **Clicks "Submit Proposal"** (Phase 2)
7. **Fills proposal form:**
   - Approach description
   - Timeline estimate
   - Suggested dataset price
   - Portfolio samples
8. **Submit** → Data owner reviews
9. **Owner accepts** → Partnership created
10. **Work together** → Launch dataset
11. **Every sale** → Curator gets 40% automatically!

### Journey 4: Automatic Revenue Splitting (Invisible)

1. **Customer browses homepage**
2. **Sees dataset with Pro Curator badge:**
   - "⭐ PRO CURATOR by Sarah Chen"
   - Badge color indicates level (blue/purple/yellow)
3. **Clicks "Buy Now"** → $100 dataset
4. **Stripe processes payment**
5. **Webhook fires:**
   - Platform: 20% ($20)
   - Checks for partnership → Found!
   - Owner: 40% ($40)
   - Curator: 40% ($40)
6. **Two earnings records created:**
   - One for data owner
   - One for curator
7. **Both payout accounts updated**
8. **Partnership stats incremented:**
   - Total sales: +1
   - Owner earnings: +$40
   - Curator earnings: +$40
9. **Curator badge auto-upgrades** (if thresholds met):
   - 10 projects + 4.5 rating → Expert
   - 50 projects + 4.8 rating → Master

---

## 📍 Navigation Map

```
Homepage (/)
├── Header Nav
│   ├── Marketplace (→ #marketplace section)
│   ├── Bounties (→ #bounties section)
│   ├── Pro Curator (→ #pro-curator section) ⭐ NEW
│   ├── Dashboard (if logged in)
│   └── Sign In (if not logged in)
│
├── #pro-curator Section ⭐ NEW
│   ├── Value propositions
│   ├── How it works
│   ├── Specialties grid
│   └── CTAs
│       ├── "Apply to Become a Pro Curator" → /dashboard?tab=pro-curator
│       └── "Browse Curation Requests" → /marketplace
│
└── #curator-form Section (existing upload form)

Dashboard (/dashboard)
├── Tabs
│   ├── Overview
│   ├── My Datasets
│   ├── My Purchases
│   ├── Earnings
│   ├── My Bounties
│   ├── My Submissions
│   └── ★ Pro Curator ⭐ NEW
│       ├── ProCuratorProfile component
│       │   ├── Application form (if not certified)
│       │   └── Profile dashboard (if certified)
│       └── "Request Curation Help" button → CurationRequestModal
│
└── Modals
    ├── DatasetUploadModal (existing)
    └── CurationRequestModal ⭐ NEW

Marketplace (/marketplace) ⭐ NEW
├── CurationRequestBoard component
├── Filters (status, specialty)
├── Request cards
└── "Submit Proposal" buttons (Phase 2)
```

---

## 🎨 Visual Design Elements

### Badge Colors
```
Verified: Blue background, blue text, blue border
Expert:   Purple background, purple text, purple border
Master:   Yellow background, yellow text, yellow border
```

### Pro Curator Branding
- **Colors:** Purple-to-Pink-to-Yellow gradients
- **Icons:** Star (⭐) for Pro features
- **Emojis:** Used throughout (🎯 💰 🤝 ✍️ 🎵 🎬 🖼️ 📝 📡 💹 🏥)
- **Shadows:** Neo-brutalist style with black borders and offset shadows
- **Typography:** Font-extrabold for headers, font-semibold for body

### Section Styling
- **Pro Curator Landing:** Gradient border (purple/pink/yellow), star icons, rounded corners
- **Request Cards:** White background, black border, 4px shadow on hover
- **Badges:** Rounded-full pills with colored backgrounds
- **CTAs:** Gradient backgrounds with black borders and hover effects

---

## 🔑 Key Features Enabled

### For Data Owners:
✅ Discover Pro Curator program on homepage
✅ Post curation requests from Dashboard
✅ See Pro Curator badges on datasets
✅ (Phase 2) Review proposals and create partnerships

### For Pro Curators:
✅ Apply for certification with portfolio
✅ View profile with stats and badge
✅ Browse curation requests by specialty
✅ See badge level auto-upgrade as they complete projects
✅ (Phase 2) Submit proposals to data owners

### For Platform:
✅ Showcase professional curation marketplace
✅ Automatic 50/50 revenue splitting on partnerships
✅ Badge system incentivizes quality work
✅ Earn 20% on higher-priced curated datasets

---

## 📊 What Happens Behind the Scenes

### When User Applies for Certification:
```sql
INSERT INTO pro_curators (
  user_id, display_name, bio, specialties, 
  portfolio_samples, certification_status, badge_level
) VALUES (
  'user-uuid', 'John Doe', 'Expert in audio...', 
  ARRAY['audio_transcription'], 
  ARRAY['https://portfolio.com'], 'pending', 'verified'
);
```

### When Data Owner Posts Request:
```sql
INSERT INTO curation_requests (
  creator_id, title, description, 
  target_quality, budget_min, budget_max,
  specialties_needed, status
) VALUES (
  'owner-uuid', 'Need audio transcription', '...',
  'standard', 1000, 2000,
  ARRAY['audio_transcription'], 'open'
);
```

### When Customer Buys Partnered Dataset:
```javascript
// Stripe webhook detects partnership
const partnership = await supabase
  .from('dataset_partnerships')
  .select('*')
  .eq('dataset_id', datasetId)
  .eq('status', 'active')
  .single()

if (partnership) {
  // Split 80% creator share → 40% + 40%
  ownerNet = creatorNet * 0.5  // $40
  curatorNet = creatorNet * 0.5  // $40
  
  // Create 2 earnings records
  // Update 2 payout accounts
  // Update partnership stats (trigger)
}
```

---

## 🚀 Next Steps (Phase 2)

### Proposal System:
1. **ProposalModal** component
2. "Submit Proposal" button → Opens modal
3. Curator fills:
   - Proposal text (approach, pitch)
   - Estimated completion days
   - Suggested dataset price
   - Portfolio samples
4. Data owner reviews proposals in Dashboard
5. "Accept" button → Creates partnership record
6. Request status → `in_progress`
7. Accepted proposal → `status='accepted'`
8. Other proposals → `status='rejected'`

### Enhanced Dashboard:
- Show active partnerships list
- Display earnings breakdown (owner vs curator)
- Show proposal history
- Rating system after completion

---

**Status:** Phase 1 Complete (6/8 tasks) ✅  
**Live URL:** Deployed to Netlify  
**Database Migration:** Run `008_pro_curator_system.sql` in Supabase  
**Documentation:** See `/docs/PRO_CURATOR_SYSTEM.md` for technical details
