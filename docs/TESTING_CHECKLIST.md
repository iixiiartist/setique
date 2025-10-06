# 🧪 SETIQUE - Comprehensive Testing Checklist

**Last Updated:** January 2025  
**Version:** Production  
**Purpose:** Complete feature testing guide for QA and validation

---

## 📋 Pre-Testing Setup

### ✅ Prerequisites
- [ ] Local environment running (`npm run dev`) or testing on live site
- [ ] Have at least 2 test accounts (one regular user, one admin)
- [ ] Stripe test mode enabled (or use test card: `4242 4242 4242 4242`)
- [ ] Supabase tables populated with test data
- [ ] Clear browser cache before starting
- [ ] Open browser DevTools console to check for errors

### 🔧 Test Accounts Needed
1. **Regular User** - For general functionality
2. **Admin User** - For admin dashboard testing
3. **Pro Curator** - For curator-specific features (can be same as regular)

---

## 🏠 1. Homepage / Landing Page

### Navigation
- [ ] Homepage loads without errors
- [ ] All navigation links work (Home, Bounties, Dashboard, Sign In)
- [ ] Logo/brand name visible and styled correctly
- [ ] Footer links present and functional
- [ ] Mobile responsive menu works

### Beta Banner
- [ ] Beta banner appears on first visit
- [ ] "Got it!" button dismisses banner
- [ ] Banner stays dismissed after page refresh

### Search & Filters
- [ ] Search bar accepts text input
- [ ] Search filters datasets by title/description
- [ ] Modality filter dropdown works (all, vision, audio, text, etc.)
- [ ] Datasets update when filters change
- [ ] Clear search/filter resets results

### Featured Datasets Section
- [ ] Featured datasets carousel displays (if any featured)
- [ ] Featured badge visible on datasets
- [ ] Click featured dataset opens detail modal
- [ ] Modal shows complete dataset information

### Marketplace Section
- [ ] All active datasets display in grid
- [ ] Each dataset shows: title, price, creator, tags, modality
- [ ] Accent colors match modality type
- [ ] "Already Purchased" badge shows for owned datasets
- [ ] Click dataset opens detail modal

### Dataset Detail Modal
- [ ] Modal opens with dataset information
- [ ] Shows: title, description, price, creator, tags, file size
- [ ] "Purchase" button visible for datasets user doesn't own
- [ ] "Download" button visible for owned datasets
- [ ] "Already Purchased" state shown correctly
- [ ] Close button (X) dismisses modal
- [ ] Click outside modal dismisses it

### Active Bounties Section
- [ ] Bounties display in list format
- [ ] Each bounty shows: title, description, budget, poster
- [ ] Click bounty opens bounty detail modal
- [ ] "No active bounties" message if empty

### Bounty Detail Modal
- [ ] Modal shows: title, description, budget, modality, requirements
- [ ] Submit button visible if user signed in
- [ ] Submit button opens submission modal
- [ ] Close button works

### Top Curators Leaderboard
- [ ] Shows top 5 curators by earnings
- [ ] Displays: rank, username, earnings
- [ ] Sorted by earnings (highest first)
- [ ] Shows "No curators yet" if empty

### Pro Curator Section
- [ ] "Become a Pro Curator" section displays
- [ ] Shows specialties grid
- [ ] "How It Works" steps visible
- [ ] "Apply to Become a Pro Curator" button works (signed in)
- [ ] "Sign In to Apply" button works (not signed in)

### Creator Studio (Upload Section)
- [ ] "Upload New Dataset" button visible when signed in
- [ ] Button opens DatasetUploadModal
- [ ] Not visible when signed out

### Post a Bounty Form
- [ ] Form visible when signed in
- [ ] Fields: Title, Description, Budget, Modality, Tags, Quantity, Deadline
- [ ] Tag input allows multiple tags (Enter to add)
- [ ] Budget accepts numeric values only
- [ ] "Post Bounty" button enabled when form valid
- [ ] Form clears after successful submission
- [ ] Success alert appears after posting
- [ ] New bounty appears in Active Bounties section

### FAQ Section
- [ ] FAQ accordion displays
- [ ] Each question expands/collapses on click
- [ ] Content readable and formatted correctly

### AI Assistant
- [ ] Purple chat bubble appears in bottom-right corner
- [ ] Click opens chat interface
- [ ] Can send messages
- [ ] Receives contextual responses
- [ ] Close button minimizes assistant
- [ ] Chat history persists during session

---

## 🔐 2. Authentication

### Sign In Modal
- [ ] "Sign In" button opens modal
- [ ] Modal shows email and password fields
- [ ] Password field has autocomplete="current-password"
- [ ] Toggle between Sign In / Sign Up modes
- [ ] Sign in with valid credentials works
- [ ] Error message shows for invalid credentials
- [ ] Close button dismisses modal

### Sign Up Flow
- [ ] Switch to Sign Up mode in modal
- [ ] Additional username field appears
- [ ] All fields required (username, email, password)
- [ ] Password minimum 6 characters enforced
- [ ] Success message after signup
- [ ] Email verification sent (check Supabase)
- [ ] Profile created in profiles table

### Sign Out
- [ ] "Sign Out" button in navigation works
- [ ] User redirected appropriately
- [ ] Session cleared
- [ ] Protected content hidden after sign out

### Password Recovery
- [ ] "Forgot Password" link present (if implemented)
- [ ] Password reset flow works (if implemented)

---

## 📦 3. Dataset Management

### Upload Dataset
- [ ] Click "Upload New Dataset" opens modal
- [ ] Form fields: Title, Description, Price, Modality, Tags, File
- [ ] File upload accepts appropriate formats
- [ ] Form validation works (required fields)
- [ ] Price accepts numeric values (can be 0 for free)
- [ ] Tags can be added (Enter key)
- [ ] Upload progress bar shows during upload
- [ ] Success message after upload
- [ ] New dataset appears in user's dashboard
- [ ] Dataset visible in marketplace

### Dataset Storage
- [ ] File uploaded to Supabase storage
- [ ] download_url saved in database
- [ ] file_size recorded correctly
- [ ] is_active set to true by default
- [ ] is_featured set to false by default (NOT auto-featured)

### Purchase Dataset
- [ ] Click "Purchase" on dataset opens checkout
- [ ] Stripe checkout session created
- [ ] Redirect to Stripe payment page
- [ ] Test card works: 4242 4242 4242 4242
- [ ] After payment, redirects to /success
- [ ] Purchase recorded in purchases table
- [ ] "Already Purchased" badge appears on dataset

### Download Dataset
- [ ] "Download" button visible on owned datasets
- [ ] Click download triggers generate-download function
- [ ] Signed URL generated
- [ ] File downloads successfully
- [ ] Download expires after timeout (security)

### Free Datasets
- [ ] Free datasets (price = 0) can be "purchased" without Stripe
- [ ] Added to library immediately
- [ ] Download available instantly

---

## 👤 4. User Dashboard

### Navigation
- [ ] Navigate to /dashboard
- [ ] Dashboard loads without errors
- [ ] All tabs visible: Overview, Datasets, Purchases, Earnings, Bounties, Submissions, Pro Curator

### Overview Tab
- [ ] Stats cards display correctly
- [ ] Shows: Datasets Created, Datasets Purchased, Total Earned, Total Spent
- [ ] Numbers accurate based on user data
- [ ] Recent activity shows (if implemented)

### My Datasets Tab
- [ ] Lists all datasets created by user
- [ ] Shows: title, price, purchase count, created date
- [ ] Empty state if no datasets created
- [ ] Can navigate to create new dataset

### My Purchases Tab
- [ ] Lists all datasets purchased by user
- [ ] Shows: dataset title, price, purchase date
- [ ] "Download" button works for each purchase
- [ ] Empty state if no purchases

### Earnings Tab
- [ ] Shows total earnings breakdown
- [ ] Platform revenue (20%) shown
- [ ] Creator revenue (80%) shown
- [ ] Stripe Connect status displayed
- [ ] "Connect with Stripe" button (if not connected)
- [ ] "Request Payout" button (if connected)
- [ ] Payout history shows (if available)

### My Bounties Tab
- [ ] Lists bounties posted by user
- [ ] Shows: title, budget, status, submission count
- [ ] Can view submissions for each bounty
- [ ] Submission review interface works
- [ ] "Approve & Purchase" button functional
- [ ] "Reject" button works

### My Submissions Tab
- [ ] Lists datasets submitted to bounties
- [ ] Shows: bounty title, dataset submitted, status
- [ ] Status shows: pending, approved, rejected
- [ ] Empty state if no submissions

### Pro Curator Tab
- [ ] Shows pro curator application form if not applied
- [ ] Form fields: Display Name, Bio, Specialties, Portfolio Samples
- [ ] Specialties checkboxes work
- [ ] Portfolio sample fields (add/remove)
- [ ] Submit application button works
- [ ] Application status shown if already applied
- [ ] Profile edit mode if approved

---

## 🎯 5. Bounty System

### Post Bounty
- [ ] Fill out bounty form on homepage
- [ ] All required fields validated
- [ ] Bounty created in bounties table
- [ ] Appears in Active Bounties section
- [ ] Visible to all users

### View Bounty
- [ ] Click bounty opens detail modal
- [ ] All information displayed correctly
- [ ] Requirements clearly shown
- [ ] Budget and deadline visible

### Submit to Bounty
- [ ] "Submit Dataset" button visible (signed in)
- [ ] Opens bounty submission modal
- [ ] Can select from user's datasets
- [ ] Or create new dataset for submission
- [ ] Submission notes field works
- [ ] Submission recorded in bounty_submissions table
- [ ] Submission counter increments on bounty

### Review Submissions (Bounty Poster)
- [ ] Can view all submissions for their bounty
- [ ] Each submission shows dataset preview
- [ ] "Approve & Purchase" button works
- [ ] Redirects to Stripe for paid datasets
- [ ] Updates submission status to 'approved'
- [ ] "Reject" button updates status to 'rejected'

---

## 🔐 6. Admin Dashboard

### Access Control
- [ ] Navigate to /admin
- [ ] Non-admin users see "Access Denied" message
- [ ] Admin users see full dashboard
- [ ] Admin status checked from admins table

### Overview Tab
- [ ] Stats cards display: Total Users, Total Datasets, Pro Curators, Pending Curators, Total Revenue
- [ ] Revenue breakdown: Platform vs Creator
- [ ] Total transactions count

### Pro Curators Tab
- [ ] Lists all pro curator applications
- [ ] Filter by status: pending, approved, rejected, suspended
- [ ] Shows: display name, bio, specialties, portfolio
- [ ] "Approve" button updates status to approved
- [ ] "Reject" button prompts for reason
- [ ] "Suspend" button (for approved curators)
- [ ] Actions logged in admin_activity_log

### Users Tab
- [ ] Lists all registered users
- [ ] Shows: username, email, join date
- [ ] "View Details" opens user modal
- [ ] User modal shows: profile info, datasets created, purchases
- [ ] "Copy ID" and "Copy Email" buttons work

### Datasets Tab
- [ ] Lists all datasets
- [ ] Shows: title, creator, price, purchase count, status
- [ ] "View Details" opens dataset modal
- [ ] Dataset modal shows full info
- [ ] "Feature/Unfeature" button toggles is_featured
- [ ] "Delete" button prompts for confirmation
- [ ] Delete removes dataset (and associated records)
- [ ] Featured badge updates instantly

### Activity Log Tab
- [ ] Shows recent admin actions
- [ ] Displays: admin name, action type, timestamp, details
- [ ] Limited to last 100 entries
- [ ] Actions include: approve_curator, reject_curator, suspend_curator, feature_dataset, delete_dataset

---

## 💳 7. Payments & Payouts

### Stripe Integration
- [ ] Stripe publishable key loaded (check console)
- [ ] Test mode indicator visible (if test keys)
- [ ] Stripe.js library loaded without errors

### Checkout Flow
- [ ] create-checkout function works
- [ ] Session ID returned
- [ ] Redirects to Stripe checkout page
- [ ] Success URL configured correctly (/success)
- [ ] Cancel URL configured correctly (/)

### Payment Success
- [ ] After payment, redirects to /success page
- [ ] Success page shows confirmation
- [ ] Purchase recorded in database
- [ ] Webhook processes payment_intent.succeeded

### Stripe Webhook
- [ ] stripe-webhook function receives events
- [ ] payment_intent.succeeded creates purchase record
- [ ] purchase status set to 'completed'
- [ ] Error handling works for invalid requests

### Stripe Connect (Creators)
- [ ] "Connect with Stripe" button in Earnings tab
- [ ] connect-onboarding function creates account
- [ ] Redirects to Stripe Connect onboarding
- [ ] Return URL configured (/dashboard?tab=earnings)
- [ ] Account ID saved in profiles table
- [ ] Onboarding status tracked

### Request Payout
- [ ] "Request Payout" button visible (if connected)
- [ ] request-payout function works
- [ ] Payout amount calculated correctly (80/20 split)
- [ ] Minimum payout amount enforced ($10)
- [ ] Payout recorded in payouts table
- [ ] Payout status tracked

---

## 🌐 8. Marketplace Page

### Page Load
- [ ] Navigate to /marketplace
- [ ] Page loads without errors
- [ ] Shows all curation requests and partnership opportunities

### Curation Request Board
- [ ] CurationRequestBoard component displays
- [ ] Shows all active curation requests
- [ ] Request cards show: title, description, budget, status
- [ ] Pro curators can submit proposals
- [ ] Non-curators see message to apply

---

## 📱 9. Responsive Design

### Mobile (< 640px)
- [ ] Navigation menu collapses to hamburger (if implemented)
- [ ] Layout stacks vertically
- [ ] Text remains readable
- [ ] Buttons touchable (44px+ tap targets)
- [ ] Modals fit screen
- [ ] Forms usable

### Tablet (640px - 1024px)
- [ ] 2-column grid layouts work
- [ ] Navigation readable
- [ ] Modals centered and sized appropriately

### Desktop (> 1024px)
- [ ] 3-4 column grids display correctly
- [ ] Max-width containers prevent excessive stretching
- [ ] Hover states work on interactive elements

---

## 🎨 10. UI/UX Features

### Styling & Design
- [ ] Neobrutalism aesthetic consistent (thick borders, bold shadows)
- [ ] Color palette: Yellow, Pink, Cyan, Black
- [ ] Font: System sans-serif, bold weights
- [ ] Gradient backgrounds render correctly
- [ ] Border styles: 2-4px black borders
- [ ] Shadow effects: [4px_4px_0_#000] style

### Animations
- [ ] Hover effects work (scale, shadow change)
- [ ] Button press animations (active:scale-95)
- [ ] Modal transitions smooth
- [ ] Loading spinners show during async operations
- [ ] Progress bars functional (upload, etc.)

### Accessibility
- [ ] Forms have labels
- [ ] Buttons have descriptive text
- [ ] Color contrast sufficient
- [ ] Keyboard navigation works
- [ ] Focus states visible

---

## 🔍 11. Data Validation & Security

### Input Validation
- [ ] Email format validated
- [ ] Password minimum length enforced (6 chars)
- [ ] Price fields accept numbers only
- [ ] Required fields enforced
- [ ] Tag limits respected
- [ ] File size limits enforced
- [ ] XSS protection (no script injection)

### Row Level Security (RLS)
- [ ] Users can only edit their own data
- [ ] Purchases only viewable by buyer/seller
- [ ] Admin actions require admin role
- [ ] Pro curator queries respect certification_status
- [ ] Bounty submissions only viewable by submitter and bounty poster

### API Security
- [ ] Netlify functions validate user authentication
- [ ] Admin functions verify admin status
- [ ] Service role key only used server-side
- [ ] Stripe webhook verifies signature
- [ ] Download URLs expire after use

---

## 🐛 12. Error Handling

### Network Errors
- [ ] Failed API calls show error messages
- [ ] Supabase connection errors handled gracefully
- [ ] Stripe errors displayed to user
- [ ] Timeout errors don't crash app

### User Errors
- [ ] Invalid form submissions prevented
- [ ] Duplicate purchases blocked
- [ ] Insufficient permissions show appropriate message
- [ ] Missing required fields highlighted

### Console Errors
- [ ] No 406 errors (admins, pro_curators queries use maybeSingle)
- [ ] No 400 errors (pro curator insert works)
- [ ] No autocomplete warnings on password fields
- [ ] No React key warnings
- [ ] No exhaustive-deps warnings

---

## 📊 13. Database Operations

### Tables Check
- [ ] All tables exist: profiles, datasets, purchases, bounties, bounty_submissions, pro_curators, admins, admin_activity_log, curation_requests, etc.
- [ ] Foreign keys configured correctly
- [ ] Indexes created for performance
- [ ] RLS policies enabled and working

### Data Integrity
- [ ] Cascade deletes work (delete dataset removes related records)
- [ ] Unique constraints enforced (user_id in pro_curators)
- [ ] Default values applied (is_active, is_featured, etc.)
- [ ] Timestamps auto-populated (created_at, updated_at)

### Missing Columns Fix
- [ ] portfolio_samples column exists in pro_curators (run sql/fixes/add_portfolio_samples_column.sql if needed)
- [ ] is_featured column exists in datasets (run sql/fixes/add_is_featured_column.sql if needed)

---

## 🚀 14. Deployment & Performance

### Build Process
- [ ] `npm run build` succeeds
- [ ] No build errors
- [ ] Bundle size reasonable
- [ ] Source maps generated (if needed)

### Netlify Deployment
- [ ] Environment variables configured
- [ ] Functions deploy successfully
- [ ] Site accessible at production URL
- [ ] SSL certificate valid
- [ ] Redirects work (_redirects file)

### Performance
- [ ] Page load time < 3 seconds
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] No memory leaks
- [ ] Console clear of errors

### SEO
- [ ] sitemap.xml accessible
- [ ] robots.txt configured
- [ ] Google Search Console verification file present (/google4115ba4671549f18.html)
- [ ] Meta tags present (if implemented)

---

## 📝 15. Content & Copy

### Text Content
- [ ] No typos in UI text
- [ ] Error messages clear and helpful
- [ ] Success messages confirm actions
- [ ] Placeholder text appropriate
- [ ] Help text informative

### Legal
- [ ] Terms of Service link (if required)
- [ ] Privacy Policy link (if required)
- [ ] Cookie consent (if required)

---

## ✅ Testing Workflow

### For Each Feature:
1. **Test as signed-out user** - Verify appropriate restrictions
2. **Test as regular user** - Verify normal functionality
3. **Test as admin** - Verify elevated permissions
4. **Test as pro curator** - Verify curator-specific features
5. **Check console** - No errors
6. **Check database** - Data persisted correctly
7. **Test edge cases** - Empty states, invalid inputs, etc.

### Regression Testing:
After any code change, re-test:
- [ ] Authentication flow
- [ ] Dataset upload/purchase/download
- [ ] Admin dashboard
- [ ] Payment processing
- [ ] Critical user paths

---

## 🎯 Priority Testing Order

### P0 (Critical - Must Work):
1. User authentication (sign in/out)
2. Dataset upload and purchase
3. Payment processing
4. Download functionality
5. Admin dashboard access control

### P1 (High - Should Work):
1. Bounty system
2. Pro curator application
3. Search and filters
4. User dashboard
5. Stripe Connect onboarding

### P2 (Medium - Nice to Have):
1. AI Assistant
2. Top curators leaderboard
3. Featured datasets
4. Activity log
5. Responsive design

### P3 (Low - Polish):
1. Animations and transitions
2. Error message clarity
3. Help text and tooltips
4. Beta banner
5. FAQ section

---

## 🐞 Bug Reporting Template

When you find a bug, document:

```
**Bug Title:** [Short description]

**Severity:** [Critical / High / Medium / Low]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**


**Actual Result:**


**Environment:**
- Browser: 
- Device: 
- User Role: 
- URL: 

**Console Errors:**


**Screenshots:**
[If applicable]

**Additional Notes:**

```

---

## 📈 Success Metrics

### Feature Completeness
- [ ] 100% of P0 features working
- [ ] 95%+ of P1 features working
- [ ] 90%+ of P2 features working

### Quality Gates
- [ ] Zero console errors on page load
- [ ] Zero blocking bugs
- [ ] All critical user paths functional
- [ ] Payment processing 100% reliable
- [ ] Admin controls working correctly

---

## 🎉 Testing Complete!

Once all items are checked:
- [ ] Document any known issues
- [ ] Create tickets for bugs
- [ ] Plan fixes for failed tests
- [ ] Celebrate what's working! 🚀

---

**Need Help?**
- Check docs/ folder for detailed guides
- Review sql/fixes/ for database fixes
- Contact: joseph@anconsulting.us
