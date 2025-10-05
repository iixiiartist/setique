# Stripe Connect Setup Guide

## 🎯 Recommended Configuration

### 1. Payment Collection Method
**Select:** ✅ **Separate charges and transfers** (Seller collects directly)

**Why:**
- Lower fees (~2.9% vs 3.4%)
- Faster payouts for creators
- Less legal complexity
- Industry standard (Etsy, Airbnb, eBay use this)
- Already implemented in your code

**How it works:**
```
Buyer pays $100 → Creator receives payment → 
Platform automatically takes $20 fee → Creator gets $80
```

### 2. Onboarding Method
**Select:** ✅ **Onboarding hosted by Stripe**

**Why:**
- Already implemented in your code
- Zero additional development
- Stripe handles all compliance
- Mobile optimized
- Automatic updates
- Trusted by sellers

**What sellers experience:**
1. Click "Connect Stripe Account" in Dashboard
2. Redirect to Stripe's secure pages
3. Complete identity verification
4. Return to Setique automatically
5. Ready to receive payouts ✅

### 3. Account Management
**Select:** ✅ **Stripe Dashboard** (dashboard.stripe.com)

**Why:**
- Zero development work
- Full-featured (payouts, taxes, analytics)
- Mobile app available
- Professional and trusted
- Direct Stripe support

**What sellers can manage on Stripe:**
- Bank account details
- Payout schedule (daily/weekly/monthly)
- Tax information & 1099s
- Payment methods
- Email notifications
- Business details
- Identity verification

**What sellers see on Setique:**
- Earnings summary
- Transaction history
- Request Payout button
- **"Manage on Stripe →" link** (NEW!)

---

## 📋 Setup Checklist

### Step 1: Enable Stripe Connect
1. Go to: https://dashboard.stripe.com/settings/connect
2. Click "Get started" or "Enable Connect"
3. Fill out platform information:
   - Platform name: **Setique**
   - Platform type: **Marketplace**
   - Website: **setique.com**

### Step 2: Select Payment Collection
1. Choose: **"Separate charges and transfers"**
2. Configure:
   - Application fee: **20%**
   - Automatic transfers: **Enabled**

### Step 3: Select Onboarding Method
1. Choose: **"Onboarding hosted by Stripe"**
2. This matches your current implementation ✅

### Step 4: Select Account Management
1. Choose: **"Stripe Dashboard"**
2. Sellers will manage details on stripe.com ✅

### Step 5: Branding (Optional)
1. Go to: https://dashboard.stripe.com/settings/branding
2. Upload your logo
3. Set brand colors (cyan #00ffff, pink #ff00c3)
4. These appear on Stripe-hosted pages

### Step 6: Configure Webhooks
1. Go to: https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://setique.com/.netlify/functions/stripe-webhook`
3. Select events:
   - ✅ `checkout.session.completed`
   - ✅ `account.updated`
4. Copy webhook signing secret
5. Add to Netlify: `STRIPE_WEBHOOK_SECRET=whsec_...`

### Step 7: Run Database Migration
In Supabase SQL Editor:
```sql
ALTER TABLE creator_payout_accounts
ADD COLUMN IF NOT EXISTS charges_enabled BOOLEAN DEFAULT false;

UPDATE creator_payout_accounts
SET charges_enabled = payouts_enabled
WHERE charges_enabled IS NULL;
```

### Step 8: Test the Flow
1. Sign in as a creator
2. Go to Dashboard → Earnings tab
3. Click "Connect Stripe Account"
4. Complete onboarding with test data
5. Verify "Manage on Stripe →" link appears
6. Click link to open Stripe Dashboard

---

## 🧪 Test Data (Test Mode)

Use these for testing Stripe Connect onboarding:

- **Phone**: +1 000-000-0000
- **SSN**: 000-00-0000
- **DOB**: 01/01/1901
- **Bank routing**: 110000000
- **Bank account**: 000123456789
- **Address**: Any valid US address

---

## 🎨 Branding Customization

### Logo Requirements
- Format: PNG or JPG
- Size: 128x128px minimum
- Recommended: 512x512px
- Background: Transparent or white
- Shows on: Onboarding pages, receipts, emails

### Color Scheme
Match your gradient theme:
- **Primary color**: #00ffff (cyan)
- **Accent color**: #ff00c3 (pink)
- Shows on: Buttons, links, highlights

---

## 🔗 Links Created on Setique

### For Sellers:
1. **"Connect Stripe Account"** button
   - Location: Dashboard → Earnings tab
   - Action: Creates Express account + onboarding link
   - Destination: Stripe-hosted onboarding

2. **"Manage on Stripe →"** link (NEW!)
   - Location: Dashboard → Earnings tab → Payout Account card
   - Action: Opens Stripe Dashboard in new tab
   - Destination: https://dashboard.stripe.com/dashboard

3. **"Request Payout"** button
   - Location: Dashboard → Earnings tab
   - Appears when: Balance ≥ $50
   - Shows: Available balance amount

---

## 📊 What Sellers See on Each Platform

### On Setique Dashboard:
- **Overview**: Sales summary, recent activity
- **Earnings Tab**:
  - Total earned, pending, paid
  - Transaction history
  - Payout account status
  - Connect/Manage buttons

### On Stripe Dashboard:
- **Home**: Earnings graph, recent payouts
- **Payouts**: Schedule, history, bank accounts
- **Settings**: Personal info, tax forms, notifications
- **Reports**: Detailed analytics, export data
- **Support**: Chat with Stripe support team

---

## 🚀 Deployment Status

- ✅ Code implemented and deployed
- ✅ "Manage on Stripe" link added
- ✅ Request Payout shows balance
- ✅ Commit: `bf620e7`
- ⏳ Awaiting: Stripe Connect enablement

---

## 🆘 Troubleshooting

### "You need to sign up for Connect"
- Go to https://dashboard.stripe.com/settings/connect
- Click "Enable Connect" or "Get started"
- Make sure you're in the correct mode (test/live)

### "Onboarding link expired"
- Links expire after ~30 minutes
- Click "Connect Stripe Account" again to generate new link
- Same account will be resumed (no duplicate)

### "Cannot open Stripe Dashboard"
- Sellers need to complete onboarding first
- Status must show "Active" with payouts enabled
- Check they're using correct Stripe account

### Webhook not receiving events
- Verify endpoint URL is correct
- Check webhook signing secret matches
- Test in Stripe Dashboard → Webhooks → Send test webhook

---

## 📈 Next Steps (Future Enhancements)

1. **Express Dashboard Integration**: Use Stripe's embedded components for basic account info
2. **Payout History**: Show payout history timeline on Setique
3. **Email Notifications**: Notify when payouts are processed
4. **Tax Center**: Link to tax documents and 1099 generation
5. **Analytics**: Show sales trends and earnings charts

---

## 📚 Resources

- **Stripe Connect Docs**: https://stripe.com/docs/connect
- **Express Accounts**: https://stripe.com/docs/connect/express-accounts
- **Account Management**: https://stripe.com/docs/connect/account-management
- **Dashboard for Connect**: https://stripe.com/docs/connect/dashboard-for-connected-accounts

---

**Configuration Summary:**

| Setting | Choice |
|---------|--------|
| Payment collection | ✅ Separate charges and transfers |
| Onboarding | ✅ Hosted by Stripe |
| Account management | ✅ Stripe Dashboard |
| Platform fee | 20% |
| Onboarding type | Express accounts |
| Status | ✅ Code ready, awaiting Stripe setup |

**Last Updated**: October 5, 2025
**Deployment**: Commit `bf620e7`
