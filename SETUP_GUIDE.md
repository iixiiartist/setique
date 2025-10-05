# 🚀 Complete Setup Guide for Non-Coders

This guide will walk you through every step needed to deploy your Setique marketplace. No coding experience required!

## Part 1: Setting Up Your Development Environment

### Step 1: Install Node.js

1. Go to https://nodejs.org
2. Download the LTS (Long Term Support) version
3. Run the installer
4. Click "Next" through all the prompts
5. Verify installation by opening PowerShell and typing:
   ```
   node --version
   ```
   You should see a version number like `v18.x.x`

## Part 2: Create Your Supabase Backend

### Step 1: Create a Supabase Account

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. Confirm your email if needed

### Step 2: Create a New Project

1. Click "New Project"
2. Choose an organization (or create one)
3. Fill in project details:
   - **Name**: setique-marketplace
   - **Database Password**: Create a strong password and SAVE IT
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free (for now)
4. Click "Create new project"
5. Wait 2-3 minutes for setup to complete

### Step 3: Get Your API Keys

1. In your project dashboard, click the settings icon (⚙️)
2. Click "API" in the sidebar
3. You'll see:
   - **Project URL**: Starts with `https://xxxxx.supabase.co`
   - **anon/public key**: Long string starting with `eyJ...`
4. SAVE THESE - you'll need them soon!

### Step 4: Set Up Your Database

1. Click the SQL Editor icon (</>) in the sidebar
2. Click "+ New query"
3. Open the file `supabase/migrations/001_initial_schema.sql` in your project
4. Copy ALL the contents
5. Paste into the Supabase SQL editor
6. Click "Run" (or press Ctrl/Cmd + Enter)
7. You should see "Success. No rows returned"

**Important**: Before running the seed data, you need to create a user first!

## Part 3: Set Up Stripe Payments

### Step 1: Create a Stripe Account

1. Go to https://stripe.com
2. Click "Start now" or "Sign in"
3. Fill in your details
4. Verify your email

### Step 2: Enable Test Mode

1. In the Stripe dashboard, look for a toggle switch that says "Test mode" in the top right
2. Make sure it's switched ON (should show "Test mode")
3. This lets you test without real money

### Step 3: Get Your API Keys

1. Click "Developers" in the left sidebar
2. Click "API keys"
3. You'll see:
   - **Publishable key**: Starts with `pk_test_...`
   - **Secret key**: Click "Reveal test key" - starts with `sk_test_...`
4. SAVE THESE KEYS!

## Part 4: Configure Your Project

### Step 1: Create Environment File

1. In your project folder, find the file `.env.example`
2. Copy it and rename the copy to `.env` (just `.env`, no `.example`)
3. Open `.env` in a text editor (Notepad works fine)
4. Replace the placeholder values with your actual keys:

```env
# From Supabase (Step 2.3)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_very_long_supabase_key_here

# From Stripe (Step 3.3)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Leave this for now, we'll set it up later
STRIPE_WEBHOOK_SECRET=whsec_placeholder
```

5. Save and close the file

### Step 2: Install Dependencies

1. Open PowerShell
2. Navigate to your project folder:
   ```
   cd "C:\Users\iixii\OneDrive\Desktop\SETIQUE"
   ```
3. Install all required packages:
   ```
   npm install
   ```
4. Wait for it to complete (might take 2-3 minutes)

## Part 5: Test Locally

### Step 1: Start the Development Server

1. In PowerShell (still in your project folder), run:
   ```
   npm run dev
   ```
2. You should see something like:
   ```
   VITE v5.x.x  ready in xxx ms
   ➜  Local:   http://localhost:3000/
   ```
3. Open your browser and go to http://localhost:3000

### Step 2: Create Your First User

1. Click "Sign In" in the top right
2. Click "Sign Up" at the bottom
3. Enter:
   - Username: testuser
   - Email: your-email@example.com
   - Password: (at least 6 characters)
4. Click "Sign Up"
5. Check your email for a confirmation link
6. Click the link to verify your account

### Step 3: Add Sample Data (Optional)

Now that you have a user:

1. Go back to Supabase SQL Editor
2. Open `supabase/migrations/002_seed_data.sql`
3. Copy and paste into a new query
4. Click "Run"

You should now see sample datasets on your homepage!

### Step 4: Test Creating a Dataset

1. On your local site, scroll to "Become a Data Curator"
2. Fill in the form:
   - Title: Test Dataset
   - Description: This is my first dataset
   - Price: 10
   - Tags: test, demo
3. Click "Publish to Marketplace"
4. You should see your dataset appear!

## Part 6: Deploy to Netlify

### Step 1: Create GitHub Repository

1. Go to https://github.com
2. Click "+" in the top right, then "New repository"
3. Name: setique-marketplace
4. Make it Private (recommended)
5. Click "Create repository"

### Step 2: Push Your Code to GitHub

1. In PowerShell, in your project folder:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/setique-marketplace.git
   git push -u origin main
   ```

### Step 3: Deploy on Netlify

1. Go to https://netlify.com
2. Sign up with GitHub (easiest way)
3. Click "Add new site" > "Import an existing project"
4. Click "GitHub"
5. Find and select your `setique-marketplace` repository
6. Build settings should auto-fill:
   - **Build command**: npm run build
   - **Publish directory**: dist
7. Click "Deploy site"

### Step 4: Add Environment Variables to Netlify

1. In your Netlify site, go to "Site settings"
2. Click "Environment variables" in the sidebar
3. Click "Add a variable"
4. Add each of these (one at a time):
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
   - `VITE_STRIPE_PUBLISHABLE_KEY` = your Stripe publishable key
   - `STRIPE_SECRET_KEY` = your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET` = leave as `whsec_placeholder` for now
5. After adding all variables, click "Trigger deploy" to rebuild

### Step 5: Set Up Stripe Webhook

1. Copy your Netlify site URL (looks like `https://amazing-name-123456.netlify.app`)
2. Go to Stripe dashboard > Developers > Webhooks
3. Click "+ Add endpoint"
4. Endpoint URL: `https://your-site.netlify.app/.netlify/functions/stripe-webhook`
5. Events to send: Search and select `checkout.session.completed`
6. Click "Add endpoint"
7. Copy the "Signing secret" (starts with `whsec_...`)
8. Go back to Netlify > Environment variables
9. Update `STRIPE_WEBHOOK_SECRET` with your new signing secret
10. Trigger another deploy

## Part 7: Test Your Live Site!

### Step 1: Create an Account

1. Go to your Netlify URL
2. Sign up with a new account
3. Verify your email

### Step 2: Test Purchasing

1. Browse the marketplace
2. Click "Buy Now" on any dataset
3. Use test card number: `4242 4242 4242 4242`
4. Any future expiration date
5. Any 3-digit CVC
6. Complete the purchase
7. You should be redirected to a success page!

## 🎉 You're Done!

Your marketplace is now live and fully functional!

## Common Issues and Solutions

### "Missing Supabase environment variables"

- Make sure your `.env` file exists (for local)
- Make sure you added all environment variables in Netlify (for production)
- Restart your dev server after changing `.env`

### Can't sign in

- Check your email for the verification link
- Make sure you clicked the verification link
- Try resetting your password in Supabase Auth settings

### Payment doesn't work

- Make sure you're using test mode in Stripe
- Check that your webhook is set up correctly
- Use the test card number: 4242 4242 4242 4242

### Site shows error after deploy

- Check the Netlify deploy logs for errors
- Make sure all environment variables are set
- Check that your Supabase database migrations ran successfully

## Need Help?

- Check the main README.md for detailed documentation
- Review Netlify deploy logs for specific errors
- Check Stripe webhook logs to see if webhooks are being received
- Check Supabase logs for database errors

## Next Steps

1. **Custom domain**: Add your own domain in Netlify settings
2. **Email templates**: Customize auth emails in Supabase
3. **Stripe production**: Switch to live mode when ready to accept real payments
4. **Add more features**: Edit the code to add your own unique features!

Congratulations on launching your marketplace! 🚀
