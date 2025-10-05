# 🎉 Stripe Connect - Approved & Ready to Activate

Congratulations! Your Stripe Connect application has been approved. Now you need to activate it for live mode to start processing real payments with automatic creator payouts.

---

## ✅ What Was Updated

### 1. **Checkout Function Enhanced**
`netlify/functions/create-checkout.js` now uses **destination charges** when creators have connected Stripe accounts:

```javascript
// Before: All money went to your account
// After: Money goes directly to creator, you take 20% platform fee

payment_intent_data: {
  application_fee_amount: platformFeeAmount, // Your 20%
  transfer_data: {
    destination: payoutAccount.stripe_connect_account_id, // Creator's account
  },
}
```

**Benefits:**
- ✅ Creators get paid faster (money goes directly to them)
- ✅ You automatically collect 20% platform fee
- ✅ Stripe handles the split transparently
- ✅ Better for tax reporting (creators receive their own 1099s)

### 2. **Frontend Updated**
`src/pages/HomePage.jsx` now passes `creatorId` during checkout so the system knows which creator to pay.

---

## 🔑 Step 1: Switch to Live Mode Keys

You need to replace your **test mode** Stripe keys with **live mode** keys.

### In Stripe Dashboard:

1. **Go to:** https://dashboard.stripe.com/apikeys
2. **Switch to:** Live mode (toggle in top left)
3. **Copy these keys:**
   - **Publishable key:** `pk_live_xxxxx`
   - **Secret key:** `sk_live_xxxxx`

### In Netlify Dashboard:

1. **Go to:** Your Netlify site → Site settings → Environment variables
2. **Update these variables:**

```
VITE_STRIPE_PUBLISHABLE_KEY = pk_live_xxxxxxxxxxxxx
STRIPE_SECRET_KEY = sk_live_xxxxxxxxxxxxx
```

3. **Save changes**
4. **Redeploy site** (Netlify → Deploys → Trigger deploy → Deploy site)

---

## 🪝 Step 2: Update Webhook for Live Mode

Webhooks need to be configured separately for test mode and live mode.

### In Stripe Dashboard:

1. **Go to:** https://dashboard.stripe.com/webhooks
2. **Make sure you're in LIVE mode** (toggle top left)
3. **Click:** "Add endpoint"
4. **Endpoint URL:** `https://your-site.netlify.app/.netlify/functions/stripe-webhook`
5. **Description:** "Setique Marketplace - Live Mode"
6. **Select events to listen to:**
   - ✅ `checkout.session.completed`
   - ✅ `account.updated`
   - ✅ `payment_intent.succeeded` (optional)
   
7. **Click:** "Add endpoint"
8. **Copy the Signing Secret:** `whsec_xxxxx`

### In Netlify Dashboard:

1. **Update environment variable:**
```
STRIPE_WEBHOOK_SECRET = whsec_xxxxxxxxxxxxx (your NEW live mode secret)
```

2. **Redeploy site**

---

## ⚙️ Step 3: Verify Connect Settings

### In Stripe Dashboard:

1. **Go to:** https://dashboard.stripe.com/settings/connect
2. **Verify settings:**
   - ✅ Connect is **Enabled**
   - ✅ Account type: **Express** (easiest for creators)
   - ✅ Platform name: "Setique" (or your brand name)
   - ✅ Business profile completed
   - ✅ Branding/logo uploaded (optional but recommended)

3. **Check platform profile:**
   - Business name: Your legal business name
   - Support email: Your support email
   - Business URL: https://your-site.netlify.app

---

## 🧪 Step 4: Test Live Mode

### Test the Full Flow:

1. **As Creator (You):**
   - Go to Dashboard → Earnings section
   - Click "Connect Stripe Account"
   - Complete onboarding with your real bank account
   - Verify you see "Connected" status

2. **As Buyer (Test User):**
   - Create a test account on your site
   - Try to purchase a dataset (use a real card - you can refund later)
   - Verify payment goes through
   - Check that you receive the download link

3. **Verify Money Flow:**
   - Check your Stripe Dashboard → Payments
   - You should see: Payment with 20% application fee
   - Creator should see: 80% in their connected account balance

4. **(Optional) Test Refund:**
   - In Stripe Dashboard → Payments
   - Find your test payment
   - Click "Refund" to get your money back
   - Verify it refunds properly

---

## 💰 How Money Flows (Live Mode)

### Scenario: Buyer purchases $50 dataset

```
1. Buyer pays $50 via Stripe Checkout
   ↓
2. Stripe automatically splits:
   - $40 (80%) → Creator's connected account
   - $10 (20%) → Your platform account (application fee)
   ↓
3. Database records:
   - Purchase: completed
   - Creator earnings: $40 pending
   - Platform earnings: $10 (in your account)
   ↓
4. Creator can request payout when balance ≥ $50
   ↓
5. Payout goes from creator's Stripe balance → their bank account
```

**Important:** The platform fee ($10) goes **directly to your Stripe account** - you don't need to request a payout for your own money!

---

## 🚨 Common Issues & Solutions

### Issue 1: "Stripe Connect not enabled"
**Solution:** Make sure you completed the Connect application in Stripe Dashboard and it shows "Enabled" in live mode.

### Issue 2: "No destination specified"
**Solution:** Make sure creators have completed Stripe onboarding and their `payouts_enabled` is true in the database.

### Issue 3: Webhook not receiving events
**Solution:** 
- Verify webhook URL is correct (https, not http)
- Check webhook signing secret matches in Netlify env vars
- Test webhook in Stripe Dashboard → Webhooks → "Send test webhook"

### Issue 4: Application fee error
**Solution:** Verify you're using live mode keys (not test mode). Application fees only work with approved Connect accounts in live mode.

---

## 📊 Monitoring & Analytics

### Track Your Platform Fees:

1. **In Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/connect/application_fees
   - See all platform fees collected

2. **In Your Database:**
   ```sql
   -- Total platform fees collected
   SELECT SUM(platform_fee) FROM creator_earnings WHERE status = 'pending' OR status = 'paid';
   
   -- Creator earnings pending payout
   SELECT creator_id, SUM(creator_net) FROM creator_earnings WHERE status = 'pending' GROUP BY creator_id;
   ```

---

## 🔒 Security Checklist

Before going live, verify:

- ✅ All API keys are **live mode** (not test mode)
- ✅ Webhook secret is **live mode** secret
- ✅ Service role key is secure (not exposed in frontend)
- ✅ RLS policies are enabled on all database tables
- ✅ Storage bucket has proper access policies
- ✅ HTTPS is enforced (Netlify does this automatically)

---

## 📝 Next Steps After Activation

### 1. **Update Documentation**
Tell your creators:
- How to connect their Stripe account
- When they can request payouts (≥$50 balance)
- Platform fee structure (20%)
- Payout timing (2-7 business days to bank)

### 2. **Add UI Enhancements** (Optional)
Consider adding:
- Earnings graph in creator dashboard
- Email notifications when balance reaches $50
- Transaction history with download links
- Estimated payout dates

### 3. **Set Up Business Operations**
- Link your business bank account to Stripe
- Set up automatic bank deposits for your platform fees
- Configure tax settings in Stripe
- Set up financial reporting

---

## ✨ You're Ready!

Once you've completed steps 1-4, your marketplace will be live with:

- ✅ Real credit card processing
- ✅ Automatic creator payouts via Stripe Connect
- ✅ 20% platform fees collected automatically
- ✅ Professional onboarding for creators
- ✅ Secure payment handling

**Questions?** Check Stripe's Connect documentation: https://stripe.com/docs/connect

---

## 🆘 Support Resources

- **Stripe Support:** https://support.stripe.com/
- **Stripe Connect Docs:** https://stripe.com/docs/connect
- **Test Mode Toggle:** Always switch back to test mode in Stripe Dashboard when debugging
- **Webhook Testing:** Use Stripe CLI for local testing: https://stripe.com/docs/stripe-cli

---

*Last Updated: January 2025*
*Status: ✅ Code Updated and Ready for Live Mode Activation*
