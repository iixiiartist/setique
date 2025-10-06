# SETIQUE - Current Features & Systems

**Last Updated**: October 5, 2025  
**Status**: ✅ Production Ready

---

## 🎯 Platform Overview

SETIQUE is a fully functional AI dataset marketplace connecting data creators with ML practitioners. Creators earn 80% per sale, and the platform includes advanced features like Pro Curator partnerships, bounty requests, and admin-approved deletion workflows.

---

## 🚀 Core Features

### 1. **Dataset Marketplace**
- Browse and search curated datasets
- Filter by category, quality level, and price
- Instant download with 24-hour signed URLs
- Duplicate purchase prevention
- Free and paid datasets support

### 2. **User Authentication**
- Email/password authentication via Supabase
- Protected routes and role-based access
- User profiles with purchase history
- Creator earnings tracking

### 3. **Dataset Upload & Management**
- Drag-and-drop file upload (up to 500MB)
- Dataset metadata: title, description, category, tags
- Quality level specification (basic/standard/premium)
- Sample size and format details
- Edit/delete functionality with ownership validation

### 4. **Stripe Connect Integration**
- 80/20 revenue split (creators get 80%)
- Automated payouts to creator Stripe accounts
- Secure checkout with Stripe Checkout
- Webhook handling for payment events
- Pro Curator revenue sharing (40% ongoing)

---

## 🎨 Advanced Features

### 5. **Pro Curator System**
**Complete partnership marketplace for dataset collaboration**

**Components:**
- Pro Curator profile creation and certification
- Badge levels: Verified, Expert, Master (based on projects)
- Curation request marketplace
- Proposal submission and acceptance
- Partnership management
- Revenue sharing (40% to curator, 40% to owner, 20% platform)

**Workflow:**
1. Data owner posts curation request with budget
2. Pro Curators submit proposals
3. Owner reviews and accepts proposal
4. Curator completes work and submits
5. Owner reviews and publishes dataset
6. Curator earns 40% on all sales

**Files:**
- `docs/PRO_CURATOR_SYSTEM.md` - Technical implementation
- `docs/PRO_CURATOR_USER_GUIDE.md` - User-facing guide
- `docs/CURATION_REQUESTS_SYSTEM.md` - Request management
- `docs/CURATION_REQUESTS_SYSTEM_REVIEW.md` - System status

### 6. **Bounty System**
**Request custom datasets with price negotiation**

**Features:**
- Post bounty requests with budget range
- Creators submit datasets to fulfill bounties
- Admin approval workflow
- Automatic payment on approval
- Status tracking (pending/approved/rejected)

**Files:**
- `docs/BOUNTY_QUICK_START.md` - User guide

### 7. **AI Assistant Chat**
**Context-aware chatbot for platform help**

**Features:**
- Embedded on every page
- Authentication status awareness
- Platform feature guidance
- FAQ responses
- Onboarding assistance

**Files:**
- `docs/AI_ASSISTANT_USER_GUIDE.md` - User guide
- `docs/AI_ASSISTANT_UPDATE.md` - Technical details

### 8. **Deletion Request System** ✨ *NEW*
**Admin-approved dataset deletion workflow**

**Features:**
- Non-admin users request deletion (not direct delete)
- Modal with reason requirement (10-1000 chars)
- Admin dashboard for request management
- Approve/reject with admin response
- 3-step cascade delete (clears foreign keys)
- Status badges (pending/approved/rejected)

**Workflow:**
1. User clicks trash icon → Request Deletion modal
2. User enters reason → Submits request
3. Admin sees pending request in dashboard
4. Admin approves (deletes dataset) or rejects (provides reason)
5. User sees status update on their dashboard

**Database:**
- `deletion_requests` table
- RLS policies for security
- Foreign key cascade handling

**Files:**
- `docs/DELETION_REQUEST_SYSTEM.md` - Complete documentation
- `sql/migrations/011_deletion_requests_system.sql` - Database schema

---

## 🔧 Admin Features

### 9. **Admin Dashboard**
**Complete platform management interface**

**Sections:**
1. **Overview Tab**
   - Platform metrics (users, datasets, revenue)
   - Recent activity feed

2. **User Management Tab**
   - View all users
   - Grant/revoke admin access
   - User activity monitoring

3. **Dataset Management Tab**
   - View all datasets
   - Edit/delete any dataset
   - Visibility controls

4. **Pro Curator Management Tab**
   - Review certification applications
   - Approve/reject curator profiles
   - Monitor partnerships

5. **Bounty Management Tab**
   - Review bounty submissions
   - Approve/reject with feedback
   - Payment processing

6. **Deletion Requests Tab** ✨ *NEW*
   - Pending requests (yellow cards)
   - Approve/reject actions
   - Admin response for rejections
   - View approved/rejected history

**Security:**
- Immediate redirect for unauthorized users
- No UI exposure to non-admins
- Admin table verification
- Protected API endpoints

---

## 📊 Database Architecture

### Core Tables (8 Total)
1. **profiles** - User information
2. **datasets** - Dataset listings
3. **purchases** - Transaction records
4. **bounties** - Bounty requests
5. **submissions** - Bounty submissions
6. **creator_earnings** - Revenue tracking
7. **creator_payout_accounts** - Stripe Connect accounts
8. **payout_requests** - Payout management

### Pro Curator Tables (4 Total)
9. **pro_curators** - Curator profiles
10. **curation_requests** - Data owner requests
11. **curator_proposals** - Curator proposals
12. **dataset_partnerships** - Active partnerships

### System Tables (2 Total)
13. **admins** - Admin role management
14. **deletion_requests** - Deletion workflow ✨ *NEW*

### Row Level Security (RLS)
- All tables have RLS policies enabled
- Users can only access/modify their own data
- Admins have elevated permissions
- Public read access where appropriate

---

## 🛠️ Technical Stack

**Frontend:**
- React 18 with Vite 5
- Tailwind CSS for styling
- React Router for navigation

**Backend:**
- Supabase (PostgreSQL + Auth + Storage)
- Row Level Security (RLS)
- Serverless functions on Netlify

**Payments:**
- Stripe Checkout
- Stripe Connect for payouts
- Webhook signature verification

**Deployment:**
- Netlify hosting
- Automatic deploys from GitHub
- Environment variable management

---

## 🔐 Security Features

1. **Authentication**
   - Supabase Auth with JWT tokens
   - Protected API endpoints
   - Session management

2. **Authorization**
   - Role-based access control (RBAC)
   - Admin verification on sensitive actions
   - Owner validation for dataset operations

3. **Data Security**
   - RLS policies on all tables
   - Signed URLs for downloads (24-hour expiry)
   - Environment variables for secrets

4. **Payment Security**
   - Stripe webhook signature verification
   - Server-side payment processing
   - Duplicate purchase prevention

5. **File Security**
   - Max upload size limits (500MB)
   - File type validation
   - Secure storage in Supabase Storage

---

## 📈 Revenue Model

**Standard Datasets:**
- Platform: 20%
- Creator: 80%

**Pro Curator Partnerships:**
- Platform: 20%
- Dataset Owner: 40%
- Pro Curator: 40%

**Payout Terms:**
- Minimum: $50.00
- Method: Stripe Connect transfers
- Frequency: On-demand requests

---

## 🚀 Deployment Status

✅ **Application**: Fully built and functional  
✅ **Database**: All tables created with RLS  
✅ **Payments**: Stripe Connect configured  
✅ **Functions**: All Netlify functions working  
✅ **Production**: Live at setique.com  
✅ **Documentation**: Complete and up-to-date  

---

## 📚 Additional Documentation

### Setup & Configuration
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Installation instructions
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Pre-deployment steps
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Common commands

### System-Specific Guides
- [PRO_CURATOR_SYSTEM.md](./PRO_CURATOR_SYSTEM.md) - Pro Curator technical docs
- [DELETION_REQUEST_SYSTEM.md](./DELETION_REQUEST_SYSTEM.md) - Deletion workflow docs
- [DATASET_MANAGEMENT.md](./DATASET_MANAGEMENT.md) - Dataset operations
- [PAYMENT_AND_DELIVERY_GUIDE.md](./PAYMENT_AND_DELIVERY_GUIDE.md) - Payment flow

### User Guides
- [PRO_CURATOR_USER_GUIDE.md](./PRO_CURATOR_USER_GUIDE.md) - For Pro Curators
- [BOUNTY_QUICK_START.md](./BOUNTY_QUICK_START.md) - For bounty users
- [AI_ASSISTANT_USER_GUIDE.md](./AI_ASSISTANT_USER_GUIDE.md) - For AI chat users

### Technical Reference
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Architecture overview
- [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) - Security analysis
- [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) - QA procedures

---

## 🎯 What's Next

**Recommended Testing:**
1. Test deletion request workflow (user → admin → approve/reject)
2. Verify Pro Curator partnership revenue splits
3. Test bounty submission and approval flow
4. Validate Stripe Connect payouts
5. Security audit admin dashboard access

**Potential Enhancements:**
- Email notifications for deletion requests
- Analytics dashboard for creators
- Bulk dataset management tools
- Advanced search filters
- Dataset versioning system

---

**For more information, see individual documentation files in the `/docs` folder.**
