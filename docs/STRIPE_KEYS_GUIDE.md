# 🔑 Stripe API Keys Setup Guide

## Understanding Stripe Keys

You need **3 different keys** for your marketplace to accept payments:

| Key | Starts With | Location | Purpose |
|-----|-------------|----------|---------|
| **Publishable** | `pk_test_...` | Frontend (browser) | Create checkout sessions |
| **Secret** | `sk_test_...` | Backend (server) | Process payments |
| **Webhook Secret** | `whsec_...` | Backend (server) | Verify webhooks |

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Stripe Account

1. Go to https://stripe.com
2. Click **"Start now"** and sign up
3. Complete account setup (skip if you have an account)

### Step 2: Get Your API Keys

1. Go to: https://dashboard.stripe.com/test/apikeys
2. You'll see two keys:

   **📋 Copy These:**
   ```
   Publishable key: pk_test_xxxxxxxxxxxxxxxxxxxxx
   Secret key: sk_test_xxxxxxxxxxxxxxxxxxxxx (click "Reveal" first)
   ```

### Step 3: Set Up Webhook

1. In Stripe Dashboard, click **"Developers"** → **"Webhooks"**
2. Click **"+ Add endpoint"**
3. Enter your endpoint URL:
   ```
   For Netlify: https://your-site-name.netlify.app/.netlify/functions/stripe-webhook
   For Local: http://localhost:8888/.netlify/functions/stripe-webhook
   ```
4. Click **"Select events"**
5. Choose: **`checkout.session.completed`**
6. Click **"Add endpoint"**
7. Click on your new endpoint
8. Click **"Signing secret"** → **"Reveal"**
9. Copy the `whsec_...` key

---

## 📝 Update Your Configuration

### For Local Development (`.env` file):

Open your `.env` file and update:

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_SECRET_HERE
```

**Save the file and restart your dev server:**
```powershell
# Stop server (Ctrl+C)
npm run dev
```

### For Production (Netlify):

1. Go to https://app.netlify.com
2. Select your site
3. Go to **Site configuration** → **Environment variables**
4. Add each variable:

   - **Key**: `VITE_STRIPE_PUBLISHABLE_KEY`
     **Value**: `pk_test_...` (paste your publishable key)
   
   - **Key**: `STRIPE_SECRET_KEY`
     **Value**: `sk_test_...` (paste your secret key)
   
   - **Key**: `STRIPE_WEBHOOK_SECRET`
     **Value**: `whsec_...` (paste your webhook secret)

5. Click **"Trigger deploy"** to rebuild with new keys

---

## 🧪 Test Your Setup

### Test Card Numbers

Use these in Stripe checkout (test mode):

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 9995` | ❌ Declined |
| `4000 0025 0000 3155` | 🔐 Requires authentication |

- **Expiry**: Any future date (e.g., 12/25)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

### Test the Flow:

1. Go to your app
2. Click **"Buy Now"** on any dataset
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. You should be redirected to success page
6. Check Supabase - purchase should be recorded!

---

## 🔒 Security Notes

### ✅ Safe to Expose:
- Publishable key (`pk_test_...`) - Can be in frontend code

### ⚠️ NEVER EXPOSE:
- Secret key (`sk_test_...`) - Server-only
- Webhook secret (`whsec_...`) - Server-only

**Your setup is secure because:**
- `.env` is in `.gitignore` (not pushed to GitHub)
- Secret keys only used in Netlify Functions (server-side)
- Frontend only uses publishable key

---

## 🔄 Test Mode vs Live Mode

### Test Mode (Development):
- Keys start with `pk_test_...` and `sk_test_...`
- No real money processed
- Use test card numbers
- Perfect for development

### Live Mode (Production):
When ready to accept real payments:
1. Complete Stripe account verification
2. Switch to **Live** mode in Stripe Dashboard
3. Copy live keys: `pk_live_...` and `sk_live_...`
4. Update environment variables with live keys
5. Real money will be processed!

---

## 🐛 Troubleshooting

### "Invalid API Key"
- Check you copied the entire key (they're long!)
- Make sure no extra spaces
- Verify you're using test keys in test mode

### "Webhook signature verification failed"
- Make sure webhook endpoint URL is correct
- Check `STRIPE_WEBHOOK_SECRET` matches what's in Stripe Dashboard
- Verify webhook is listening to `checkout.session.completed` event

### Checkout works but database not updated
- Check Netlify Functions logs
- Verify webhook endpoint is set up in Stripe
- Make sure webhook secret is correct

### "No such checkout session"
- Session IDs expire after 24 hours
- Make sure you're using test mode keys consistently

---

## 📊 Monitor Your Payments

### Stripe Dashboard:
- **Payments**: See all transactions
- **Customers**: View customer details
- **Logs**: Debug webhook deliveries

### Your Database:
```powershell
# Check purchases in your database
npm run check-db
```

Then go to Supabase → Table Editor → `purchases` table

---

## 🎯 Quick Checklist

Before going live with payments:

- [ ] All 3 Stripe keys added to `.env`
- [ ] Environment variables added to Netlify
- [ ] Webhook endpoint created in Stripe
- [ ] Webhook secret copied to env vars
- [ ] Tested with test card successfully
- [ ] Purchase appears in database
- [ ] Success page shows after payment

---

## 💡 Pro Tips

1. **Use Stripe CLI for local webhook testing:**
   ```powershell
   stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
   ```

2. **Check webhook deliveries** in Stripe Dashboard if purchases aren't recording

3. **Start with test mode** - only switch to live when everything works perfectly

4. **Monitor the Netlify Functions logs** to debug payment issues

---

## 📚 Additional Resources

- **Stripe Testing**: https://stripe.com/docs/testing
- **Stripe Webhooks**: https://stripe.com/docs/webhooks
- **Stripe Dashboard**: https://dashboard.stripe.com

---

## 🎉 You're All Set!

Once you've added all three keys:
1. ✅ Publishable key (frontend)
2. ✅ Secret key (backend) 
3. ✅ Webhook secret (backend)

Your marketplace will be able to:
- Accept payments
- Process transactions
- Update database automatically
- Handle success/failure flows

**Ready to make some money!** 💰
