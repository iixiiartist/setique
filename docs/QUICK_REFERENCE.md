# 🎯 Quick Reference Guide

## ⚠️ Important: Always Check Schema First
**Before writing any database queries, check [`DATABASE_SCHEMA_REFERENCE.md`](./DATABASE_SCHEMA_REFERENCE.md)** to verify actual column names. The database may differ from migration files!

## Essential Commands

```bash
# Development
npm install              # Install dependencies (first time only)
npm run dev             # Start dev server at localhost:3000
npm run build           # Build for production
npm run preview         # Preview production build

# Git
git add .                         # Stage all changes
git commit -m "Your message"      # Commit changes
git push origin main              # Push to GitHub
```

## Essential URLs

### Development
- **Local app**: http://localhost:3000
- **Vite dev server**: Usually auto-opens browser

### Production (after deployment)
- **Your site**: https://your-site-name.netlify.app
- **Netlify dashboard**: https://app.netlify.com
- **Supabase dashboard**: https://app.supabase.com
- **Stripe dashboard**: https://dashboard.stripe.com

## Environment Variables Quick Copy

```env
# Supabase (get from supabase.com project settings)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe (get from stripe.com developers > API keys)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

## Stripe Test Cards

```
Success:          4242 4242 4242 4242
Decline:          4000 0000 0000 0002
Requires Auth:    4000 0025 0000 3155

Expiration: Any future date
CVC: Any 3 digits
```

## Common File Locations

```
Configuration
├── .env                    # Your secret keys (DO NOT COMMIT!)
├── .env.example            # Template for .env
├── package.json            # Dependencies and scripts
├── vite.config.js          # Build settings
├── netlify.toml            # Deploy settings
└── tailwind.config.js      # Styles

Frontend Code
├── src/
│   ├── main.jsx            # Entry point
│   ├── App.jsx             # Router
│   ├── pages/
│   │   ├── HomePage.jsx    # Main marketplace
│   │   └── SuccessPage.jsx # After purchase
│   ├── components/         # Reusable UI
│   ├── contexts/           # Auth & state
│   └── lib/                # Supabase & Stripe

Backend Code
├── netlify/functions/
│   ├── create-checkout.js  # Creates payment
│   └── stripe-webhook.js   # Processes payment

Database
└── supabase/migrations/
    ├── 001_initial_schema.sql
    └── 002_seed_data.sql
```

## Key Database Tables

```sql
profiles          # User accounts
├── id (uuid)
├── email
├── username
└── created_at

datasets          # For sale datasets
├── id (uuid)
├── creator_id    # -> profiles.id
├── title
├── description
├── price
├── tags
└── purchase_count

purchases         # Transaction records
├── id (uuid)
├── user_id       # -> profiles.id
├── dataset_id    # -> datasets.id
├── amount
├── status
└── stripe_session_id

bounties          # Custom requests
├── id (uuid)
├── creator_id    # -> profiles.id
├── title
├── budget
└── status
```

## Troubleshooting Quick Fixes

### "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Environment variables not working
```bash
# Restart dev server
# Press Ctrl+C to stop
npm run dev
```

### Build fails on Netlify
1. Check Netlify deploy logs
2. Verify all environment variables are set
3. Make sure no `.env` file is committed

### Database errors
1. Check Supabase logs
2. Verify RLS policies
3. Make sure you're signed in

### Stripe checkout not working
1. Check browser console for errors
2. Verify Stripe keys are correct
3. Check Stripe dashboard logs

## File Size Limits

```
Supabase (Free tier)
├── Database: 500 MB
├── Storage: 1 GB
└── Bandwidth: 2 GB/month

Netlify (Free tier)
├── Build minutes: 300/month
├── Bandwidth: 100 GB/month
└── Functions: 125k requests/month

Stripe (Test mode)
└── Unlimited test transactions
```

## Security Reminders

✅ DO:
- Keep `.env` in `.gitignore`
- Use environment variables for secrets
- Use HTTPS (Netlify provides free SSL)
- Enable Supabase RLS policies
- Test in Stripe test mode first

❌ DON'T:
- Commit `.env` to Git
- Put secrets in frontend code
- Use production Stripe keys for testing
- Disable RLS policies
- Share your secret keys

## Quick Debugging

### Check if server is running
```bash
# Should show node process
Get-Process node
```

### Check environment variables (in dev)
```javascript
// In browser console
console.log(import.meta.env)
```

### Check Supabase connection
```javascript
// In browser console
const { data, error } = await supabase.from('datasets').select('*')
console.log(data, error)
```

### Check if database migration ran
1. Go to Supabase dashboard
2. Click "Table Editor"
3. Should see: profiles, datasets, purchases, bounties

## Important Ports

```
3000  - Vite dev server (your app)
8888  - Netlify dev server (for testing functions locally)
54321 - Supabase local development (if using Supabase CLI)
```

## VS Code Extensions (Recommended)

- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Prettier - Code formatter
- ESLint

## Git Branches Strategy

```bash
main              # Production (auto-deploys to Netlify)
development       # Development branch
feature/xyz       # Feature branches
```

## Useful NPM Scripts

```bash
npm run dev           # Start development
npm run build         # Build for production
npm run preview       # Preview build locally
npm install           # Install dependencies
npm update            # Update dependencies
npm outdated          # Check for outdated packages
```

## Performance Tips

1. **Images**: Optimize before uploading
2. **Build**: Run `npm run build` to check for errors
3. **Caching**: Netlify handles this automatically
4. **Lazy loading**: Consider for large datasets
5. **Database**: Add indexes for frequently queried fields

## Support & Resources

📖 **Documentation**
- README.md - Technical details
- SETUP_GUIDE.md - Step-by-step setup
- PROJECT_SUMMARY.md - Project overview
- This file - Quick reference

🌐 **Official Docs**
- React: https://react.dev
- Vite: https://vitejs.dev
- Supabase: https://supabase.com/docs
- Stripe: https://stripe.com/docs
- Netlify: https://docs.netlify.com
- Tailwind: https://tailwindcss.com

💬 **Community**
- React Discord
- Supabase Discord
- Stripe Discord

---

**Pro Tip**: Bookmark this file for quick access! 🔖
