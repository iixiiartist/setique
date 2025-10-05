# SETIQUE - The Niche Data Marketplace

A fully functional niche data marketplace built with React, Supabase, Stripe, and Netlify.

## 🚀 Features

- **User Authentication**: Sign up, sign in, and profile management with Supabase Auth
- **Dataset Marketplace**: Browse, search, and purchase unique datasets
- **Creator Tools**: Upload and sell your own datasets
- **Bounty System**: Post bounties for custom datasets you need
- **Payment Processing**: Secure payments with Stripe
- **Real-time Updates**: Live data with Supabase subscriptions
- **Responsive Design**: Beautiful, modern UI with Tailwind CSS

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js (v18 or higher) installed
- A Supabase account (free tier is fine)
- A Stripe account (test mode is fine for development)
- A Netlify account (for deployment)

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned
3. Go to **Project Settings** > **API**
4. Copy your **Project URL** and **anon/public API key**

#### Run Database Migrations

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL Editor and click **Run**
5. Repeat for `supabase/migrations/002_seed_data.sql` (optional - adds sample data)

**Important**: After running the migrations, you need to create at least one user profile before the seed data will work. Sign up through your app first, then run the seed migration.

### 3. Set Up Stripe

1. Go to [https://stripe.com](https://stripe.com) and sign in
2. Switch to **Test Mode** (toggle in the top right)
3. Go to **Developers** > **API Keys**
4. Copy your **Publishable key** and **Secret key**

#### Set Up Webhook (for production)

1. Go to **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL: `https://your-site.netlify.app/.netlify/functions/stripe-webhook`
4. Select events: `checkout.session.completed`
5. Copy the **Signing secret**

For local development, use the Stripe CLI:
```bash
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
```

### 4. Environment Variables

Create a `.env` file in the root directory:

```bash
# Copy from .env.example
cp .env.example .env
```

Edit `.env` with your actual keys:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Important**: Variables starting with `VITE_` are exposed to the browser. Never put secret keys in `VITE_` variables!

### 5. Run Locally

```bash
npm run dev
```

Your app will be available at `http://localhost:3000`

### 6. Deploy to Netlify

#### Option A: Deploy from Git (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Netlify](https://netlify.com) and click **Add new site** > **Import an existing project**
3. Connect your repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Add environment variables in **Site settings** > **Environment variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
6. Click **Deploy site**

#### Option B: Deploy with Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize and deploy
netlify init
netlify deploy --prod
```

## 🔐 Security Best Practices

### Supabase Row Level Security (RLS)

The database schema includes RLS policies that:
- Allow anyone to view active datasets
- Only allow authenticated users to create datasets
- Only allow creators to edit their own datasets
- Only allow users to view their own purchases

### Environment Variables

Never commit your `.env` file! It's already in `.gitignore`.

For Netlify deployment, add all environment variables through the Netlify dashboard.

## 📊 Database Schema

### Tables

- **profiles**: User profiles (extends Supabase auth.users)
- **datasets**: Published datasets for sale
- **purchases**: Purchase records
- **bounties**: Custom dataset requests
- **bounty_submissions**: Submissions for bounties

See `supabase/migrations/001_initial_schema.sql` for complete schema.

## 💳 Stripe Integration

### Payment Flow

1. User clicks "Buy Now" on a dataset
2. Frontend calls Netlify function `create-checkout`
3. Function creates a Stripe Checkout Session
4. User is redirected to Stripe hosted checkout
5. After payment, Stripe sends webhook to `stripe-webhook` function
6. Webhook handler updates purchase status in database
7. User is redirected to success page

### Testing Stripe

Use these test card numbers:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002

Use any future expiration date and any 3-digit CVC.

## 🐛 Troubleshooting

### "Missing Supabase environment variables"

Make sure your `.env` file exists and contains the correct keys. Restart the dev server after changing `.env`.

### Stripe webhook not working locally

Install Stripe CLI and run:
```bash
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
```

### Database RLS errors

Make sure you're signed in when trying to create datasets. Check that RLS policies are applied correctly.

### Build fails on Netlify

- Check that all environment variables are set in Netlify dashboard
- Make sure `NODE_VERSION` is set to 18 in Netlify (should be automatic with `netlify.toml`)
- Check the deploy logs for specific errors

## 📁 Project Structure

```
setique/
├── netlify/
│   └── functions/           # Serverless functions
│       ├── create-checkout.js
│       ├── stripe-webhook.js
│       └── package.json
├── src/
│   ├── components/          # React components
│   │   ├── Icons.jsx
│   │   ├── SignInModal.jsx
│   │   └── TagInput.jsx
│   ├── contexts/            # React contexts
│   │   └── AuthContext.jsx
│   ├── lib/                 # Library configurations
│   │   ├── supabase.js
│   │   └── stripe.js
│   ├── pages/               # Page components
│   │   └── HomePage.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── supabase/
│   └── migrations/          # Database migrations
│       ├── 001_initial_schema.sql
│       └── 002_seed_data.sql
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── netlify.toml
└── README.md
```

## 🔄 Development Workflow

1. **Make changes** to your code
2. **Test locally** with `npm run dev`
3. **Commit** your changes
4. **Push** to your repository
5. **Netlify** automatically deploys

## 📝 Adding Features

### Add a new dataset field

1. Add column in `supabase/migrations/001_initial_schema.sql`
2. Update form in `HomePage.jsx`
3. Update display in dataset cards

### Add a new payment method

1. Update Stripe checkout session in `create-checkout.js`
2. Add payment method in Stripe dashboard

## 📧 Support

For issues or questions:
- Check the troubleshooting section above
- Review Supabase docs: https://supabase.com/docs
- Review Stripe docs: https://stripe.com/docs
- Review Netlify docs: https://docs.netlify.com

## 📄 License

This project is open source and available under the MIT License.

## 🎉 You're All Set!

Your Setique marketplace is now ready to use. Happy curating! 🚀
