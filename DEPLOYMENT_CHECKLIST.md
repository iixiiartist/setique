# ✅ Deployment Checklist - UPDATED October 5, 2025

## 🎉 BUILD FIXES COMPLETED!

All Netlify build issues have been resolved:

✅ **Cache fetch errors** - Fixed (see `NETLIFY_BUILD_FIX.md`)  
✅ **Invalid Node version** - Fixed (see `NODE_VERSION_FIX.md`)  
✅ **Missing Stripe dependency** - Fixed (see `NETLIFY_FUNCTIONS_FIX.md`)  

**Current Status:** Code is pushed, build should succeed now!

---

Use this checklist to track your deployment progress.

## 🔧 Local Setup

- [ ] Node.js installed (v18+)
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with all keys
- [ ] App runs locally (`npm run dev`)
- [ ] Can sign up and create account
- [ ] Can browse datasets
- [ ] Can create dataset
- [ ] Can post bounty

## 🗄️ Supabase Configuration

- [x] Supabase project created ✅
- [x] Project URL copied to `.env` ✅
- [x] Anon/public key copied to `.env` ✅
- [x] SQL migration `001_initial_schema.sql` executed ✅
- [x] At least one user account created ✅
- [x] SQL migration `002_seed_data.sql` executed ✅
- [x] Can see tables in Supabase dashboard ✅
- [x] RLS policies are enabled ✅
- [x] Authentication is configured ✅
- [ ] SQL migration `003_creator_payouts.sql` executed ⏳ **NEED TO RUN THIS**

## 💳 Stripe Configuration

- [x] Stripe account created ✅
- [x] LIVE mode enabled ⚠️ (using live keys, not test)
- [x] Publishable key copied to `.env` ✅
- [x] Secret key copied to `.env` ✅
- [ ] Test purchase works locally (use card: 4242 4242 4242 4242)
- [ ] Webhook endpoint configured (for production) ⏳ **NEED NETLIFY URL FIRST**
- [x] Webhook secret copied to `.env` ✅

## 🌐 Git Repository

- [ ] GitHub/GitLab/Bitbucket account created
- [ ] Repository created
- [ ] `.gitignore` includes `.env`
- [ ] Code committed
- [ ] Code pushed to remote

## 🚀 Netlify Deployment

- [x] Netlify account created ✅
- [x] Site connected to Git repository ✅
- [x] Build configuration fixed ✅
  - [x] Node version: 20 (was invalid 18.20.8)
  - [x] Build command: `npm ci && cd netlify/functions && npm ci && cd ../.. && npm run build`
  - [x] All lock files committed
  - [x] Stripe dependency in root package.json
- [x] Publish directory set to `dist` ✅
- [ ] ⏳ **WAITING FOR BUILD TO COMPLETE**
- [ ] Environment variables added to Netlify:
  - [ ] `VITE_SUPABASE_URL` = (from your .env file)
  - [ ] `VITE_SUPABASE_ANON_KEY` = (from your .env file)
  - [ ] `VITE_STRIPE_PUBLISHABLE_KEY` = (starts with pk_live_...) ⚠️ LIVE KEY
  - [ ] `STRIPE_SECRET_KEY` = (starts with sk_live_...) ⚠️ LIVE KEY
  - [ ] `STRIPE_WEBHOOK_SECRET` = (starts with whsec_...)
- [ ] First deploy successful
- [ ] 4 functions deployed successfully:
  - [ ] create-checkout
  - [ ] stripe-webhook
  - [ ] connect-onboarding
  - [ ] request-payout
- [ ] Site loads without errors
- [ ] Can sign up on live site
- [ ] Can browse datasets on live site

⚠️ **NOTE:** You're using LIVE Stripe keys! Real money will be processed!

## 🔗 Stripe Webhook (Production)

- [ ] Copied Netlify site URL
- [ ] Created webhook endpoint in Stripe
- [ ] Endpoint URL: `https://your-site.netlify.app/.netlify/functions/stripe-webhook`
- [ ] Selected event: `checkout.session.completed`
- [ ] Copied webhook signing secret
- [ ] Updated `STRIPE_WEBHOOK_SECRET` in Netlify
- [ ] Triggered new deploy
- [ ] Test purchase on live site works
- [ ] Webhook logs show successful calls

## 🧪 Production Testing

- [ ] Sign up with real email works
- [ ] Email verification works
- [ ] Can sign in after verification
- [ ] Can browse all datasets
- [ ] Search and filters work
- [ ] Can create new dataset
- [ ] Can post bounty
- [ ] Can initiate checkout
- [ ] Stripe checkout page loads
- [ ] Test payment completes
- [ ] Redirected to success page
- [ ] Purchase recorded in database
- [ ] Can sign out
- [ ] Mobile responsive (test on phone)

## 🔐 Security Check

- [ ] `.env` file is in `.gitignore`
- [ ] No secrets committed to Git
- [ ] RLS policies enabled on all tables
- [ ] Stripe is in test mode (until ready for production)
- [ ] HTTPS is enabled (Netlify does this automatically)
- [ ] CORS is properly configured

## 📧 Email Configuration (Optional)

- [ ] Custom email templates in Supabase
- [ ] "From" email address verified
- [ ] Test email delivery
- [ ] Customize email content

## 🎨 Customization (Optional)

- [ ] Updated site title in `index.html`
- [ ] Added custom favicon
- [ ] Updated colors in `tailwind.config.js`
- [ ] Customized text on homepage
- [ ] Added custom domain in Netlify

## 📈 Analytics (Optional)

- [ ] Google Analytics added
- [ ] Netlify Analytics enabled
- [ ] Error tracking configured (e.g., Sentry)

## 🚦 Go Live Checklist

When ready to accept real payments:

- [ ] Stripe account fully verified
- [ ] Bank account connected to Stripe
- [ ] Business details completed in Stripe
- [ ] Switch Stripe to **Live Mode**
- [ ] Update environment variables with live keys:
  - [ ] `VITE_STRIPE_PUBLISHABLE_KEY` (live key)
  - [ ] `STRIPE_SECRET_KEY` (live secret)
- [ ] Create new webhook for live mode
- [ ] Update `STRIPE_WEBHOOK_SECRET` with live webhook secret
- [ ] Test small purchase with real card
- [ ] Verify funds appear in Stripe dashboard
- [ ] Announce launch! 🎉

## 📝 Documentation

- [ ] README.md is complete
- [ ] SETUP_GUIDE.md is accurate
- [ ] PROJECT_SUMMARY.md is helpful
- [ ] Environment variables documented

## 🎉 Post-Launch

- [ ] Monitor Netlify logs for errors
- [ ] Monitor Stripe dashboard for payments
- [ ] Check Supabase logs for issues
- [ ] Collect user feedback
- [ ] Plan next features

---

**Tip**: Print this checklist or keep it open while deploying!

**Need help?** Check SETUP_GUIDE.md for detailed instructions on each step.
