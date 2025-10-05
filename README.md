# SETIQUE - Curated Dataset Marketplace for AI Training Data

**Turn your unique data into passive income.** Sell curated datasets to AI researchers, data scientists, and ML engineers. Perfect for creators, writers, artists, photographers, musicians, hobbyists, and domain experts.

A fully functional dataset marketplace built with React, Supabase, Stripe Connect, and Netlify. Creators earn 80% per sale + 40% ongoing revenue as Pro Curators. Buyers discover niche datasets for computer vision, NLP, audio ML, and video understanding.

## 🎯 For Data Creators & Sellers

✅ **Monetize Your Expertise**: Turn photos, audio, text, videos into income  
✅ **80% Revenue Share**: Keep most of what you earn (20% platform fee)  
✅ **Passive Income**: Upload once, earn forever  
✅ **Pro Curator Program**: Partner with dataset owners, earn 40% ongoing  
✅ **No Upfront Costs**: Free to list datasets  
✅ **Instant Payouts**: Stripe Connect automated transfers  
✅ **Work Remotely**: Perfect side hustle for gig workers and freelancers

## 🤖 For AI/ML Practitioners

✅ **Niche Datasets**: Unique vision, audio, text, video datasets  
✅ **Expert Curated**: Quality data from domain specialists  
✅ **Instant Download**: Secure 24-hour signed URLs  
✅ **No Subscriptions**: Pay per dataset, no recurring fees  
✅ **Bounty System**: Request custom datasets  
✅ **Pro Curator Badge**: Verified expert curation

## 🎯 Project Status

✅ **Application**: Fully built and functional  
✅ **Database**: Supabase configured with 8 tables  
✅ **Payments**: Stripe Connect integration with 80/20 revenue split  
✅ **Deployment**: Configured for Netlify with serverless functions  
📋 **Production**: Ready for environment variable configuration

## 🚀 Quick Start

### Prerequisites

- Node.js v20.17.0 or higher
- npm 9.0.0 or higher
- Supabase account (free tier)
- Stripe account (supports Connect)
- Netlify account (for deployment)

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# Then run locally
npm run dev
```

Visit `http://localhost:3000` to see your app.

## 📚 Documentation

All detailed documentation has been moved to the [`docs/`](./docs) folder for better organization.

### � Essential Guides

- **[Setup Guide](./docs/SETUP_GUIDE.md)** - Complete installation and configuration
- **[Quick Reference](./docs/QUICK_REFERENCE.md)** - Common commands and tasks
- **[Deployment Checklist](./docs/DEPLOYMENT_CHECKLIST.md)** - Pre-deployment steps

### 🔧 Configuration

- **[Supabase Setup](./docs/SUPABASE_SETUP_COMPLETE.md)** - Database configuration
- **[Stripe Keys Guide](./docs/STRIPE_KEYS_GUIDE.md)** - API keys configuration
- **[Stripe Connect Guide](./docs/STRIPE_CONNECT_GUIDE.md)** - Creator payout setup

### 🛠️ Automation Scripts

PowerShell automation scripts are in the [`scripts/`](./scripts) folder:

- **setup.ps1** - Full automated setup
- **setup-simple.ps1** - Simplified setup script
- **quickstart.ps1** - Quick start script


## 🏗️ Project Structure

```
SETIQUE/
├── src/                    # React application source
│   ├── components/         # Reusable UI components
│   ├── contexts/           # React contexts (Auth, etc.)
│   ├── lib/                # Supabase & Stripe clients
│   └── pages/              # Page components
├── netlify/
│   └── functions/          # Serverless functions
├── supabase/
│   └── migrations/         # Database migrations
├── docs/                   # All documentation
├── scripts/                # Automation scripts
├── dist/                   # Build output (generated)
└── netlify.toml           # Netlify configuration
```

## 🎨 Tech Stack

- **Frontend**: React 18, Vite 5, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Payments**: Stripe Connect with webhooks
- **Functions**: Netlify Functions (Node.js)
- **Deployment**: Netlify

## 💳 Revenue Model

- **Platform Fee**: 20% on all transactions
- **Creator Share**: 80% of sale price
- **Minimum Payout**: $50.00
- **Payout Method**: Stripe Connect transfers

## 🔒 Security

- All secrets are stored in `.env` (not committed to git)
- Stripe webhook signatures verified
- Supabase Row Level Security (RLS) enabled
- Environment variables validated at runtime

## 🚀 Deployment

### Netlify Deployment

1. Push code to GitHub
2. Connect repository to Netlify
3. Configure environment variables in Netlify dashboard
4. Deploy automatically on push to main branch

**Required Environment Variables:**
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
```

See [Deployment Checklist](./docs/DEPLOYMENT_CHECKLIST.md) for complete steps.

## 📊 Database Schema

The application uses 8 tables:

**Core Tables:**
- `profiles` - User profiles
- `datasets` - Dataset listings
- `purchases` - Purchase records
- `bounties` - Bounty requests
- `submissions` - Bounty submissions

**Payout Tables:**
- `creator_earnings` - Track creator earnings
- `creator_payout_accounts` - Stripe Connect accounts
- `payout_requests` - Payout request tracking

## 🐛 Troubleshooting

If you encounter issues during deployment or setup, check the [docs folder](./docs) for detailed troubleshooting guides:

- [Build Fixes](./docs/BUILD_FIX_COMPLETE.md)
- [Netlify Configuration](./docs/NETLIFY_CONFIG_FIX.md)
- [Security Audit](./docs/SECURITY_AUDIT.md)

## 📝 License

This project is private and proprietary.

---

**For detailed documentation, see the [`docs/`](./docs) folder.**
