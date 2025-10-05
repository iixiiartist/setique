# ✅ Stripe Connect Activation Checklist

Use this checklist to activate your approved Stripe Connect account for live payments.

---

## 🔑 Step 1: Get Live Mode API Keys

- [ ] Go to https://dashboard.stripe.com/apikeys
- [ ] Switch to **Live mode** (toggle in top left)
- [ ] Copy **Publishable key** (starts with `pk_live_`)
- [ ] Copy **Secret key** (starts with `sk_live_`)
- [ ] Keep these keys secure - you'll add them to Netlify next

---

## 🔐 Step 2: Update Netlify Environment Variables

- [ ] Go to https://app.netlify.com → Your site → Site settings → Environment variables
- [ ] Update `VITE_STRIPE_PUBLISHABLE_KEY` with your `pk_live_xxxxx` key
- [ ] Update `STRIPE_SECRET_KEY` with your `sk_live_xxxxx` key
- [ ] Click "Save" on each variable
- [ ] Go to Deploys tab
- [ ] Click "Trigger deploy" → "Deploy site"
- [ ] Wait for deploy to finish (~2 minutes)

---

## 🪝 Step 3: Create Live Mode Webhook

- [ ] Go to https://dashboard.stripe.com/webhooks
- [ ] **Make sure you're in LIVE mode** (very important!)
- [ ] Click "Add endpoint"
- [ ] Enter endpoint URL: `https://YOUR-SITE.netlify.app/.netlify/functions/stripe-webhook`
- [ ] Select these events:
  - [ ] `checkout.session.completed`
  - [ ] `account.updated`
- [ ] Click "Add endpoint"
- [ ] Copy the **Signing secret** (starts with `whsec_`)
- [ ] Go back to Netlify → Environment variables
- [ ] Update `STRIPE_WEBHOOK_SECRET` with the new `whsec_xxxxx` secret
- [ ] Save and redeploy site again

---

## ⚙️ Step 4: Verify Connect Settings

- [ ] Go to https://dashboard.stripe.com/settings/connect
- [ ] Verify Connect shows as **Enabled**
- [ ] Verify Account type is set to **Express**
- [ ] Check that your platform name is set (e.g., "Setique")
- [ ] Verify business profile is complete
- [ ] (Optional) Upload your logo/branding

---

## 🧪 Step 5: Test Live Mode

### As Creator (yourself):
- [ ] Go to your site's Dashboard
- [ ] Click "Connect Stripe Account" in Earnings section
- [ ] Complete Stripe onboarding with your real bank account
- [ ] Verify you see "Connected" status after completion

### As Buyer (test):
- [ ] Create a test user account on your site
- [ ] Upload a dataset with a small price (like $1)
- [ ] Purchase it with a real card (you can refund later)
- [ ] Verify payment goes through
- [ ] Check you receive download link

### Verify Money Flow:
- [ ] Go to Stripe Dashboard → Payments
- [ ] Find your test payment
- [ ] Verify you see the 20% application fee listed
- [ ] Check that creator's balance increased by 80%
- [ ] (Optional) Refund the test payment

---

## 🎉 You're Live!

Once all checkboxes are complete:

✅ **Your marketplace is processing real payments**  
✅ **Creators are getting paid automatically**  
✅ **You're collecting 20% platform fees**  
✅ **Everything is secure and compliant**

---

## 📞 Need Help?

**If something isn't working:**

1. Double-check you're in **Live mode** in Stripe Dashboard (not test mode)
2. Verify all environment variables are saved in Netlify
3. Make sure you redeployed after updating env vars
4. Check webhook is created in LIVE mode (not test mode)
5. Test the webhook by clicking "Send test webhook" in Stripe Dashboard

**Still stuck?**
- Review the detailed guide: `docs/STRIPE_CONNECT_ACTIVATION.md`
- Contact Stripe Support: https://support.stripe.com/

---

*Pro Tip: Keep your test mode keys saved somewhere safe. You can switch back to test mode anytime for development/debugging by swapping the keys back in Netlify.*
