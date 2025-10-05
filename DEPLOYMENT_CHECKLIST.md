# ✅ Deployment Checklist

Use this checklist to ensure everything is properly configured before going live.

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

- [ ] Supabase project created
- [ ] Project URL copied to `.env`
- [ ] Anon/public key copied to `.env`
- [ ] SQL migration `001_initial_schema.sql` executed
- [ ] At least one user account created
- [ ] SQL migration `002_seed_data.sql` executed (optional)
- [ ] Can see tables in Supabase dashboard
- [ ] RLS policies are enabled
- [ ] Authentication is configured

## 💳 Stripe Configuration

- [ ] Stripe account created
- [ ] Test mode enabled
- [ ] Publishable key copied to `.env`
- [ ] Secret key copied to `.env`
- [ ] Test purchase works locally (use card: 4242 4242 4242 4242)
- [ ] Webhook endpoint configured (for production)
- [ ] Webhook secret copied to `.env`

## 🌐 Git Repository

- [ ] GitHub/GitLab/Bitbucket account created
- [ ] Repository created
- [ ] `.gitignore` includes `.env`
- [ ] Code committed
- [ ] Code pushed to remote

## 🚀 Netlify Deployment

- [ ] Netlify account created
- [ ] Site connected to Git repository
- [ ] Build command set to `npm run build`
- [ ] Publish directory set to `dist`
- [ ] Environment variables added:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `VITE_STRIPE_PUBLISHABLE_KEY`
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] First deploy successful
- [ ] Site loads without errors
- [ ] Can sign up on live site
- [ ] Can browse datasets on live site

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
