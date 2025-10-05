# 📁 Project Structure

Clean, organized structure for the Setique AI Data Marketplace.

## Root Directory

```
SETIQUE/
├── .env                          # Environment variables (local)
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore rules
├── .npmrc                        # npm configuration
├── .nvmrc                        # Node version specification
├── index.html                    # Main HTML entry point
├── package.json                  # Dependencies and scripts
├── vite.config.js               # Vite build configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
├── eslint.config.js             # ESLint rules
├── netlify.toml                 # Netlify deployment config
├── README.md                     # Project README
├── CLEANUP_RECOMMENDATIONS.md   # Code quality analysis
│
├── docs/                        # 📚 Documentation
│   ├── *.md                     # Active documentation
│   └── archive/                 # Historical docs
│       ├── old/                 # Completed milestones
│       └── *.md                 # Archived guides
│
├── sql/                         # 🗄️ Database Scripts
│   ├── README.md                # SQL scripts guide
│   ├── diagnostic/              # Database diagnostics
│   ├── setup/                   # Initial setup scripts
│   ├── fixes/                   # Bug fix scripts
│   ├── migrations/              # Historical migrations
│   └── admin/                   # Admin management
│
├── scripts/                     # 🔧 Setup Scripts
│   ├── setup.ps1                # Full setup
│   ├── setup-simple.ps1         # Simple setup
│   └── quickstart.ps1           # Quick start
│
├── supabase/                    # 🔐 Supabase Configuration
│   └── migrations/              # Automated migrations
│       └── *.sql                # Migration files
│
├── netlify/                     # ⚡ Serverless Functions
│   └── functions/               # Netlify Edge Functions
│       ├── admin-actions.js     # Admin operations
│       ├── connect-onboarding.js # Stripe Connect setup
│       ├── create-checkout.js   # Payment processing
│       └── download-dataset.js  # Secure downloads
│
├── src/                         # 💻 React Application
│   ├── main.jsx                 # App entry point
│   ├── App.jsx                  # Main app component
│   ├── index.css                # Global styles
│   │
│   ├── components/              # Reusable components
│   │   ├── BountySubmissionModal.jsx
│   │   ├── DatasetUploadModal.jsx
│   │   ├── ProCuratorProfile.jsx
│   │   └── ...
│   │
│   ├── pages/                   # Page components
│   │   ├── HomePage.jsx         # Main marketplace
│   │   ├── DashboardPage.jsx    # User dashboard
│   │   ├── AdminDashboard.jsx   # Admin panel
│   │   └── SuccessPage.jsx      # Payment success
│   │
│   ├── contexts/                # React contexts
│   │   └── AuthContext.jsx      # Authentication state
│   │
│   └── lib/                     # Utilities
│       └── supabase.js          # Supabase client
│
├── public/                      # 📦 Static Assets
│   ├── _redirects               # Netlify redirects
│   ├── robots.txt               # SEO robots file
│   ├── sitemap.xml             # SEO sitemap
│   └── about.md                 # About page content
│
└── dist/                        # 🏗️ Build Output (generated)
    └── ...                      # Production build files
```

## Key Directories Explained

### `/docs` - Documentation
- **Active docs** in root (current guides, checklists)
- **`/archive`** for completed documentation
- **`/archive/old`** for historical milestones

### `/sql` - Database Scripts
Organized by purpose:
- **`diagnostic/`** - Check database health
- **`setup/`** - Initial table creation
- **`fixes/`** - Bug fixes and corrections
- **`migrations/`** - Historical migration steps
- **`admin/`** - Admin management scripts

See `sql/README.md` for detailed usage.

### `/supabase` - Database Configuration
- **`migrations/`** - Automated migrations (run by Supabase CLI)
- These are version-controlled and applied automatically

### `/netlify/functions` - Serverless Backend
All backend operations run as Netlify Edge Functions:
- **`admin-actions.js`** - Admin operations (bypasses RLS)
- **`create-checkout.js`** - Stripe payment processing
- **`connect-onboarding.js`** - Stripe Connect onboarding
- **`download-dataset.js`** - Secure file downloads

### `/src` - React Application
- **`pages/`** - Full page components
- **`components/`** - Reusable UI components
- **`contexts/`** - Global state management
- **`lib/`** - Utilities and helpers

## Important Files

### Configuration Files
- **`.env`** - Local environment variables (never commit!)
- **`.env.example`** - Template for environment setup
- **`netlify.toml`** - Netlify deployment settings
- **`vite.config.js`** - Build configuration

### Package Management
- **`package.json`** - Dependencies and scripts
- **`package-lock.json`** - Locked dependency versions

### Styling
- **`tailwind.config.js`** - Custom Tailwind classes
- **`postcss.config.js`** - CSS processing
- **`src/index.css`** - Global styles and Tailwind imports

## Build & Development

### Development
```bash
npm run dev              # Start dev server
```

### Production Build
```bash
npm run build           # Build for production
npm run preview         # Preview production build
```

### Deployment
Automatic via Netlify on push to `main` branch.

## File Naming Conventions

- **React Components**: PascalCase (e.g., `HomePage.jsx`)
- **Utilities**: camelCase (e.g., `supabase.js`)
- **SQL Scripts**: snake_case (e.g., `fix_admin_recursion.sql`)
- **Documentation**: SCREAMING_SNAKE_CASE (e.g., `README.md`)

## Best Practices

### Don't Commit
- `.env` (contains secrets)
- `node_modules/` (installed via npm)
- `dist/` (generated on build)

### Do Commit
- `.env.example` (template)
- All source code
- Documentation
- SQL scripts (except personal admin scripts)

### File Organization
- Keep components small and focused
- One component per file
- Group related files in folders
- Document complex logic

---

**Last Updated:** October 5, 2025  
**Project:** Setique AI Data Marketplace  
**Status:** Production Ready ✅
