# 💰 Stripe Connect Payout System with Minimum Threshold

## 🎯 System Overview

Your marketplace now supports **automatic creator payouts** using Stripe Connect with a **minimum cashout threshold**.

### How It Works:

```
1. BUYER purchases dataset → $50
   ↓
2. AUTOMATIC SPLIT:
   - Platform Fee (20%): $10 → Your account
   - Creator Earnings (80%): $40 → Held in balance
   ↓
3. CREATOR BALANCE accumulates from multiple sales
   ↓
4. When balance ≥ $50 (threshold)
   ↓
5. CREATOR can request payout
   ↓
6. Money transferred to creator's Stripe account
```

---

## 🔢 Key Settings

### Configurable in Code:

```javascript
// Platform fee (you keep this percentage)
PLATFORM_FEE_PERCENTAGE = 0.20  // 20%

// Minimum payout amount
MINIMUM_PAYOUT_THRESHOLD = 50.00  // $50
```

### Change these in:
- `netlify/functions/stripe-webhook.js` (line 12)
- `netlify/functions/request-payout.js` (line 10-11)

---

## 📊 Database Schema

### New Tables Added:

#### 1. `creator_earnings`
Tracks each sale and creator's share:
```sql
{
  id: UUID
  creator_id: UUID          -- Who earned it
  dataset_id: UUID          -- Which dataset sold
  purchase_id: UUID         -- Link to purchase
  amount: $50.00            -- Total sale price
  platform_fee: $10.00      -- Your 20%
  creator_net: $40.00       -- Creator's 80%
  status: 'pending'         -- pending | paid | held
  earned_at: timestamp
}
```

#### 2. `creator_payout_accounts`
Tracks creator's balance and Stripe account:
```sql
{
  id: UUID
  creator_id: UUID
  stripe_connect_account_id: 'acct_xxx'
  account_status: 'active'
  current_balance: $127.50     -- Available to cash out
  total_earned: $450.00        -- All-time earnings
  total_paid: $322.50          -- Already paid out
  minimum_payout_threshold: $50.00
  payouts_enabled: true
}
```

#### 3. `payout_requests`
Tracks payout history:
```sql
{
  id: UUID
  creator_id: UUID
  amount: $100.00
  status: 'completed'       -- pending | processing | completed | failed
  stripe_payout_id: 'tr_xxx'
  requested_at: timestamp
  completed_at: timestamp
}
```

---

## 🚀 Implementation Steps

### Step 1: Run Database Migration

```powershell
# The SQL file is already created at:
# supabase/migrations/003_creator_payouts.sql
```

**In Supabase Dashboard:**
1. Go to SQL Editor
2. Copy content from `003_creator_payouts.sql`
3. Run the migration
4. Verify tables created: `creator_earnings`, `creator_payout_accounts`, `payout_requests`

### Step 2: Enable Stripe Connect

**In Stripe Dashboard:**
1. Go to https://dashboard.stripe.com/settings/connect
2. Enable **Stripe Connect**
3. Choose **Express** accounts (easiest for creators)
4. Set your platform name and branding
5. Add webhook endpoint: `/.netlify/functions/stripe-webhook`

### Step 3: Deploy Updated Functions

**Files already created:**
- ✅ `netlify/functions/stripe-webhook.js` (updated)
- ✅ `netlify/functions/request-payout.js` (new)
- ✅ `netlify/functions/connect-onboarding.js` (new)

**Deploy:**
```powershell
git add .
git commit -m "Add Stripe Connect payout system"
git push origin main
```

Netlify will automatically deploy the new functions!

### Step 4: Add Creator Dashboard UI

You'll need to add UI components for:
- **Connect Stripe** button (for creators to link account)
- **Earnings Dashboard** (show balance, history)
- **Request Payout** button (when balance ≥ $50)

**Want me to create these components?**

---

## 💡 How Creators Use It

### First Time Setup (One-time):

1. **Creator signs up** on your platform
2. **Creator clicks "Connect Stripe Account"**
3. **Redirected to Stripe** to create Express account
4. **Completes verification** (name, bank info, tax ID)
5. **Account linked** ✅

### Making Sales:

1. **Buyer purchases creator's dataset** → $50
2. **Automatic calculation:**
   - Your platform: $10 (20%)
   - Creator balance: +$40 (80%)
3. **Balance updates immediately**

### Cashing Out:

1. **Creator checks balance**: $127.50
2. **Clicks "Request Payout"**
3. **Enters amount**: $100 (leaves $27.50)
4. **System validates:**
   - ✅ Amount ≥ $50 minimum
   - ✅ Amount ≤ current balance
   - ✅ Stripe account active
5. **Payout processed** (usually 2 business days)
6. **Money arrives** in creator's bank account

---

## 🔒 Security & Validation

### Automatic Checks:

✅ **Minimum threshold enforced**: Can't withdraw less than $50
✅ **Balance verification**: Can't withdraw more than available
✅ **Account status check**: Must complete Stripe onboarding
✅ **Duplicate prevention**: One payout request at a time
✅ **Audit trail**: All transactions logged

### Error Handling:

| Error | User Sees |
|-------|-----------|
| Balance < $50 | "Minimum payout is $50. Current balance: $37.25" |
| Insufficient funds | "Available: $60, Requested: $80" |
| Account not verified | "Please complete Stripe onboarding first" |
| Transfer fails | Marked as failed, balance restored |

---

## 📈 Tracking & Analytics

### For Platform Owner (You):

**Total platform revenue:**
```sql
SELECT SUM(platform_fee) as total_revenue
FROM creator_earnings
WHERE status = 'paid';
```

**Pending payouts:**
```sql
SELECT 
  p.username,
  a.current_balance,
  a.total_earned
FROM creator_payout_accounts a
JOIN profiles p ON a.creator_id = p.id
WHERE a.current_balance >= 50
ORDER BY a.current_balance DESC;
```

**Payout history:**
```sql
SELECT 
  p.username,
  r.amount,
  r.status,
  r.requested_at,
  r.completed_at
FROM payout_requests r
JOIN profiles p ON r.creator_id = p.id
ORDER BY r.requested_at DESC;
```

### For Creators:

**My earnings:**
```sql
SELECT 
  SUM(CASE WHEN status = 'pending' THEN creator_net ELSE 0 END) as available_balance,
  SUM(creator_net) as total_earned,
  COUNT(*) as total_sales
FROM creator_earnings
WHERE creator_id = 'creator-uuid-here';
```

---

## 💰 Platform Fee Examples

### Different Fee Structures:

| Sale Price | 10% Fee | 20% Fee | 30% Fee |
|------------|---------|---------|---------|
| $10 | You: $1<br>Creator: $9 | You: $2<br>Creator: $8 | You: $3<br>Creator: $7 |
| $50 | You: $5<br>Creator: $45 | You: $10<br>Creator: $40 | You: $15<br>Creator: $35 |
| $100 | You: $10<br>Creator: $90 | You: $20<br>Creator: $80 | You: $30<br>Creator: $70 |
| $500 | You: $50<br>Creator: $450 | You: $100<br>Creator: $400 | You: $150<br>Creator: $350 |

**Industry standards:**
- Etsy: 6.5% + $0.20
- Upwork: 10-20%
- Fiverr: 20%
- Gumroad: 10%
- App stores: 15-30%

**Your current setting:** 20% (very reasonable!)

---

## 🔧 Customization Options

### Change Minimum Threshold:

Edit `netlify/functions/request-payout.js`:
```javascript
// Change from $50 to $100
const MINIMUM_PAYOUT_THRESHOLD = 100.00

// Or make it lower for testing
const MINIMUM_PAYOUT_THRESHOLD = 10.00
```

### Change Platform Fee:

Edit both files:
- `netlify/functions/stripe-webhook.js`
- `netlify/functions/request-payout.js`

```javascript
// Change from 20% to 15%
const PLATFORM_FEE_PERCENTAGE = 0.15

// Or higher commission
const PLATFORM_FEE_PERCENTAGE = 0.30  // 30%
```

### Per-Creator Thresholds:

You could allow creators to set their own minimum:
```sql
-- Already in schema!
UPDATE creator_payout_accounts
SET minimum_payout_threshold = 25.00
WHERE creator_id = 'uuid-here';
```

---

## 🧪 Testing the System

### Test Flow:

1. **Create test creator account**
2. **Upload dataset** priced at $50
3. **Connect Stripe** (use Stripe test mode)
4. **Make test purchase** with card: `4242 4242 4242 4242`
5. **Check creator balance**: Should show $40 (80%)
6. **Try cashout with $25**: Should fail (below $50)
7. **Make another purchase**: Balance now $80
8. **Request $50 payout**: Should succeed!
9. **Check Stripe Dashboard**: See transfer

### Test Accounts:

**Stripe provides test connected accounts:**
- No real bank account needed
- Instant approval in test mode
- Can see full flow

---

## 🚨 Important Notes

### Before Going Live:

1. **Switch to Live Mode** in Stripe
2. **Get creators to verify identity** (required by law)
3. **Set up tax reporting** (Stripe handles 1099s)
4. **Update terms of service** (explain fee structure)
5. **Test with small real transaction** first

### Legal Considerations:

- ✅ Stripe handles KYC (Know Your Customer)
- ✅ Stripe handles tax forms (1099-K)
- ✅ Creators are responsible for their own taxes
- ⚠️ You may need merchant of record status
- ⚠️ Consult with lawyer/accountant

### Fees to Consider:

**Stripe's fees:**
- Standard processing: 2.9% + $0.30 per transaction
- Transfer fee: $0 (for Express accounts)
- Payout fee: $0 (included)

**Example:**
- Buyer pays: $50
- Stripe takes: $1.75 (3.5%)
- You receive: $48.25
- Platform fee (20%): $9.65
- Creator gets: $38.60

**So your actual take after Stripe fees:**
- Gross: $9.65
- After Stripe: $7.90 (15.8% effective)

---

## 📚 API Endpoints

### For Frontend to Call:

#### 1. Connect Stripe Account
```javascript
POST /.netlify/functions/connect-onboarding
Body: {
  creatorId: "uuid",
  email: "creator@email.com",
  returnUrl: "https://yoursite.com/dashboard?success=true"
}
Response: {
  url: "https://connect.stripe.com/setup/..." // Redirect here
}
```

#### 2. Request Payout
```javascript
POST /.netlify/functions/request-payout
Body: {
  creatorId: "uuid",
  amount: 75.50  // Optional, defaults to full balance
}
Response: {
  success: true,
  message: "Payout of $75.50 initiated!",
  new_balance: "52.00"
}
```

#### 3. Check Balance
```javascript
// Query Supabase directly
const { data } = await supabase
  .from('creator_payout_accounts')
  .select('current_balance, total_earned, total_paid')
  .eq('creator_id', userId)
  .single()
```

---

## 🎯 Summary

### What You Have Now:

✅ **Automatic earnings tracking** - Every sale recorded
✅ **Platform fee system** - You keep 20% of each sale
✅ **Balance accumulation** - Creators earn 80% per sale
✅ **Minimum threshold** - Must have $50+ to cash out
✅ **Stripe Connect** - Instant payouts to creators
✅ **Audit trail** - All transactions logged
✅ **Security** - Full validation and error handling

### What Creators Get:

✅ **Automatic earnings** from every sale
✅ **Real-time balance** updates
✅ **Self-service payouts** when they hit $50
✅ **Fast transfers** (2 business days)
✅ **Professional setup** via Stripe
✅ **Tax forms** handled by Stripe

### What You Get:

✅ **20% of every sale** automatically
✅ **No manual payout work** (fully automated)
✅ **Complete audit trail** of all transactions
✅ **Scalable system** (handles thousands of creators)
✅ **Professional platform** that creators trust

---

## 🚀 Next Steps

1. **Run the SQL migration** in Supabase
2. **Enable Stripe Connect** in your dashboard
3. **Deploy the updated functions** to Netlify
4. **Test with a small transaction**
5. **Add creator dashboard UI** (want me to build this?)

**Ready to make this go live?** Everything is already coded and ready to deploy! 💰
