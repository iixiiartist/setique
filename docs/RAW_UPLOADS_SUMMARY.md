# Raw Uploads Feature - Implementation Summary

**Status:** Planning Complete ✅  
**Implementation Plan:** `docs/RAW_UPLOADS_IMPLEMENTATION_PLAN.md`  
**Timeline:** 3-4 weeks

---

## 🎯 Overview

Allow creators to upload **raw, unlabeled data** alongside fully curated datasets, with admin review for quality assurance.

### Three-Tier System
- **📦 Raw** ($5-25): Unprocessed data, no labels/metadata
- **🏗️ Partial** ($20-60): Some labeling done (20-80% complete)
- **🏷️ Curated** ($50-150+): Fully labeled, production-ready

---

## 🔑 Key Features

### 1. Admin Review Workflow
**Problem:** Need quality control for raw uploads  
**Solution:** Non-Pro-Curators' raw uploads require admin approval before listing

- ✅ **Auto-approved:** Pro Curators skip review (instant publishing)
- ⏳ **Pending review:** Regular users' raw uploads reviewed within 24-48 hours
- ❌ **Rejected:** Datasets not meeting standards with feedback notes

**Database Fields:**
- `review_status` - pending/approved/rejected
- `reviewed_by` - Admin user ID
- `reviewed_at` - Timestamp
- `review_notes` - Internal feedback

### 2. Getting Started Guide (Replaces Data Curation Guide)
**Problem:** Current homepage guide is too long, doesn't cover platform features  
**Solution:** Dedicated `/resources` page with 4 comprehensive tabs

#### Tab 1: Platform Guide
- Quick start steps (5 minutes)
- Platform features overview
- Path selection (seller/buyer/curator)
- Pro tips for beginners

#### Tab 2: Data Curation Concepts
- What is data curation?
- Modalities and formats
- Labeling techniques
- Quality standards
- (Moves existing homepage guide content here)

#### Tab 3: Raw vs Curated Data
- Comparison table
- Price ranges by level
- When to choose each tier
- Upgrade path visualization

#### Tab 4: Tips for Success
- **For Data Sellers:** Pricing, README writing, sample previews
- **For Pro Curators:** Specialization, reputation building
- **For Data Buyers:** Filtering, verification badges
- **Common Mistakes:** What to avoid
- **Admin Review Tips:** Approval criteria checklist

### 3. Sample Preview System
**Requirement:** Raw and partial datasets must include 3-10 preview files

- Helps buyers assess quality before purchase
- Max 5MB per file (use thumbnails/excerpts)
- Stored in `sample_preview_urls` array field

### 4. README Documentation
**Requirement:** Raw datasets must include README content

- Minimum 100 characters
- Should describe: file formats, number of files, use cases
- Validation function checks for key terms

### 5. Pro Curator Benefits
**Incentive:** Pro status holders get fast-track privileges

- ✅ Skip admin review (auto-approved)
- 🔵 Verified badge on profile
- 📈 Higher visibility in marketplace
- 💼 Access to curation requests

---

## 📊 Database Schema Changes (Migration 026)

### New Fields Added to `datasets` Table

| Field | Type | Purpose |
|-------|------|---------|
| `curation_level` | TEXT | raw/partial/curated |
| `sample_preview_urls` | TEXT[] | Array of preview file URLs |
| `metadata_completeness` | INTEGER | 0-100% labeling progress |
| `readme_content` | TEXT | Markdown documentation |
| `quality_score` | INTEGER | 1-5 star rating |
| `verified_by_curator` | BOOLEAN | Pro Curator stamp |
| `review_status` | TEXT | pending/approved/rejected |
| `reviewed_by` | UUID | Admin who reviewed |
| `reviewed_at` | TIMESTAMPTZ | Review timestamp |
| `review_notes` | TEXT | Internal admin notes |
| `original_curation_level` | TEXT | For upgrade tracking |
| `upgraded_at` | TIMESTAMPTZ | Upgrade timestamp |

### Indexes for Performance
- `idx_datasets_curation_level` - Filter by raw/partial/curated
- `idx_datasets_review_status` - Admin dashboard queries
- `idx_datasets_review_status_created` - Pending review queue (FIFO)
- `idx_datasets_quality_score` - Sort by rating
- `idx_datasets_verified` - Filter Pro Curator verified

### RLS Policies
- Public can only see `review_status = 'approved'`
- Creators can view their own pending/rejected datasets
- Admins can view all datasets regardless of status

---

## 🎨 UI/UX Components

### New Components
1. **CurationLevelBadge.jsx** - Color-coded badges (orange/yellow/green/purple)
2. **AdminReviewPanel.jsx** - Admin dashboard for pending review queue
3. **ResourcesPage.jsx** - 4-tab Getting Started guide

### Modified Components
1. **DatasetUploadModal.jsx** - Three-button selector at top (Raw/Partial/Curated)
2. **DatasetCard.jsx** - Show curation badge + metadata completeness
3. **HomePage.jsx** - Remove long guide, add Getting Started teaser
4. **DatasetsPage.jsx** - Add curation level filters, hide pending from public
5. **AdminDashboard.jsx** - Add pending reviews section

---

## ⚡ Business Logic

### Price Validation by Level
```javascript
const minimums = {
  raw: 0,      // Can be free
  partial: 5,   // Min $5
  curated: 10   // Min $10
}

const ranges = {
  raw: { min: 5, max: 25 },
  partial: { min: 20, max: 60 },
  curated: { min: 50, max: 150 }
}
```

### Upload Flow (Non-Pro-Curator)
1. User selects "Raw" in upload modal
2. Form shows: sample preview upload + README editor
3. User submits dataset
4. Database: `review_status = 'pending'`, `is_active = false`
5. Admin receives notification
6. Admin reviews within 24-48 hours
7. If approved: `review_status = 'approved'`, `is_active = true`, creator notified
8. If rejected: `review_status = 'rejected'`, creator notified with feedback

### Upload Flow (Pro Curator)
1. User with `is_pro_curator = true` selects "Raw"
2. Form shows same fields
3. User submits dataset
4. Database: `review_status = 'approved'`, `is_active = true` (auto-approved)
5. Dataset goes live immediately

### Upgrade Path
- Raw → Partial → Curated (can only move up)
- Original level tracked in `original_curation_level`
- Upgrade via Pro Curator partnership (40/40/20 split)

---

## 📋 Implementation Phases

### Phase 1: Database (Week 1, Days 1-2)
- ✅ Create Migration 026
- ✅ Add 12 new fields to `datasets` table
- ✅ Create 5 indexes
- ✅ Add RLS policies
- ✅ Test on staging, deploy to production

### Phase 2: UI Components (Week 1, Days 3-5)
- Create CurationLevelBadge component
- Update DatasetUploadModal with three-track system
- Add admin review logic to submission flow
- Update DatasetCard with badges

### Phase 3: Resources Page (Week 2)
- Create ResourcesPage with 4 tabs
- Move curation guide content from HomePage
- Write new "Platform Guide" and "Success Tips" sections
- Update HomePage to remove guide, add teaser
- Add `/resources` route to App.jsx

### Phase 4: Admin Tools (Week 2-3)
- Create AdminReviewPanel component
- Add pending review queue to AdminDashboard
- Build approve/reject action handlers
- Add notification system for review outcomes

### Phase 5: Marketplace Updates (Week 3)
- Add curation level filters to DatasetsPage
- Update search/sort to hide pending datasets from public
- Add "Raw uploads available!" banner
- Update Pro Curator dashboard with fast-track badge

### Phase 6: Testing & Launch (Week 4)
- Database constraint tests
- Frontend component tests
- E2E upload flows (Pro vs non-Pro)
- Admin review workflow testing
- Performance testing with indexes

---

## 📈 Success Metrics (30 Days Post-Launch)

- **30% adoption:** 30% of new uploads use raw/partial option
- **15% curation requests:** 15% of raw dataset owners post curation requests
- **10% upgrades:** 10% of raw datasets upgraded to curated via Pro Curator
- **<48hr reviews:** All pending reviews completed within 48 hours
- **Zero support increase:** No spike in support tickets (clear UX)

---

## 🚨 Risk Mitigation

### Quality Concerns
✅ **Solution:** Admin review for non-Pro-Curators  
✅ **Solution:** Clear badges prevent buyer confusion  
✅ **Solution:** Strong README requirements

### Marketplace Clutter
✅ **Solution:** Default sort = "Curated First"  
✅ **Solution:** Curation level filters prominent  
✅ **Solution:** Sample previews help buyers assess quickly

### Admin Workload
✅ **Solution:** Pro Curators auto-approved (reduces queue)  
✅ **Solution:** Automated validation checks before review  
✅ **Solution:** Clear rejection templates speed process

### Pricing Confusion
✅ **Solution:** Dynamic price guidance in upload modal  
✅ **Solution:** Comparison table in Getting Started guide  
✅ **Solution:** Min price enforced by database constraints

---

## 🔗 Related Systems

### Pro Curator System Integration
- Raw data owners can click "Request Curation" on their datasets
- Links to existing curation request flow
- When Pro Curator completes work, dataset auto-upgrades to curated
- Partnership created with 40/40/20 revenue split

### Trust Level System
- Pro Curators have higher trust automatically
- Raw upload approvals count toward trust level increase
- Rejected uploads may lower trust score

### Notification System
- "Your raw upload is pending review" (on submission)
- "Your dataset was approved!" (with marketplace link)
- "Your dataset needs adjustments" (with feedback notes)
- "New pending review" (to admins)

---

## 📝 Next Steps

1. **Review this plan** - Stakeholder approval on approach
2. **Begin Phase 1** - Database migrations (estimate: 2 days)
3. **Create admin panel first** - Need review tools before allowing raw uploads
4. **Build Resources page** - Educational content before launch
5. **Soft launch** - Invite beta testers (Pro Curators first)
6. **Full launch** - Announce on homepage + social media

---

## 📚 Documentation

- **Full Plan:** `docs/RAW_UPLOADS_IMPLEMENTATION_PLAN.md` (1800+ lines)
- **This Summary:** `docs/RAW_UPLOADS_SUMMARY.md`
- **Pro Curator System:** `docs/PRO_CURATOR_SYSTEM.md`
- **Database Schema:** `docs/DATABASE_SCHEMA_REFERENCE.md`

---

**Last Updated:** January 2025  
**Status:** ✅ Ready for Implementation
