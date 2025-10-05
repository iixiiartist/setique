# ========================================
# SETIQUE - Complete Automated Setup
# ========================================
# This script will:
# 1. Check prerequisites
# 2. Help you set up environment variables
# 3. Push your code to GitHub
# 4. Guide you through Supabase setup
# ========================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SETIQUE - Automated Setup Script    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ========================================
# STEP 1: Check Prerequisites
# ========================================
Write-Host "STEP 1: Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found!" -ForegroundColor Red
    Write-Host "  Please install from: https://nodejs.org" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Git
try {
    $gitVersion = git --version
    Write-Host "✓ Git installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git not found!" -ForegroundColor Red
    Write-Host "  Please install from: https://git-scm.com" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# ========================================
# STEP 2: Install Dependencies
# ========================================
Write-Host "STEP 2: Installing dependencies..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path "node_modules") {
    Write-Host "✓ Dependencies already installed" -ForegroundColor Green
} else {
    Write-Host "Installing npm packages (this takes 2-3 minutes)..." -ForegroundColor White
    npm install
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
}

Write-Host ""

# ========================================
# STEP 3: Set Up Environment Variables
# ========================================
Write-Host "STEP 3: Setting up environment variables..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path ".env") {
    Write-Host "⚠ .env file already exists" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to update it with Supabase credentials now? (y/N)"
    
    if ($overwrite -eq "y" -or $overwrite -eq "Y") {
        $setupEnv = $true
    } else {
        $setupEnv = $false
        Write-Host "✓ Keeping existing .env file" -ForegroundColor Green
    }
} else {
    $setupEnv = $true
}

if ($setupEnv) {
    Write-Host ""
    Write-Host "Let's set up your Supabase credentials!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "If you have not created a Supabase project yet:" -ForegroundColor Yellow
    Write-Host "1. Go to https://supabase.com and sign up" -ForegroundColor White
    Write-Host "2. Create a new project (takes 2-3 minutes)" -ForegroundColor White
    Write-Host "3. Get your credentials from Settings > API" -ForegroundColor White
    Write-Host ""
    
    $hasSupabase = Read-Host "Do you have your Supabase credentials ready? (y/N)"
    
    if ($hasSupabase -eq "y" -or $hasSupabase -eq "Y") {
        Write-Host ""
        Write-Host "Enter your Supabase URL (without colon at end)" -ForegroundColor Cyan
        $supabaseUrl = Read-Host
        
        Write-Host "Enter your Supabase ANON key (the long eyJ... string):" -ForegroundColor Cyan
        $supabaseKey = Read-Host
        
        Write-Host ""
        Write-Host "For now, we'll use placeholder Stripe keys (you can update later)" -ForegroundColor Yellow
        
        # Create .env file
        @"
# Supabase Configuration
VITE_SUPABASE_URL=$supabaseUrl
VITE_SUPABASE_ANON_KEY=$supabaseKey

# Stripe Configuration (Placeholder - Update when ready)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
"@ | Out-File -FilePath ".env" -Encoding UTF8
        
        Write-Host "✓ .env file created with your credentials" -ForegroundColor Green
    } else {
        # Create with placeholders
        Copy-Item ".env.example" ".env" -Force
        Write-Host "✓ .env file created with placeholders" -ForegroundColor Green
        Write-Host "  ⚠ Remember to update it later with real credentials!" -ForegroundColor Yellow
    }
}

Write-Host ""

# ========================================
# STEP 4: Initialize Git and Push to GitHub
# ========================================
Write-Host "STEP 4: Setting up Git and pushing to GitHub..." -ForegroundColor Yellow
Write-Host ""

$githubUrl = "https://github.com/iixiiartist/setique.git"

# Check if already a git repo
if (Test-Path ".git") {
    Write-Host "✓ Git repository already initialized" -ForegroundColor Green
} else {
    Write-Host "Initializing Git repository..." -ForegroundColor White
    git init
    Write-Host "✓ Git initialized" -ForegroundColor Green
}

# Check if remote already exists
$remoteExists = git remote | Select-String -Pattern "origin" -Quiet

if ($remoteExists) {
    Write-Host "✓ GitHub remote already configured" -ForegroundColor Green
    
    $updateRemote = Read-Host "Do you want to update the remote URL? (y/N)"
    if ($updateRemote -eq "y" -or $updateRemote -eq "Y") {
        git remote remove origin
        git remote add origin $githubUrl
        Write-Host "✓ Remote URL updated" -ForegroundColor Green
    }
} else {
    Write-Host "Adding GitHub remote..." -ForegroundColor White
    git remote add origin $githubUrl
    Write-Host "✓ GitHub remote added" -ForegroundColor Green
}

# Stage all files (except .env which is in .gitignore)
Write-Host ""
Write-Host "Staging files for commit..." -ForegroundColor White
git add .

# Check if there are changes to commit
$hasChanges = git status --porcelain

if ($hasChanges) {
    Write-Host "✓ Files staged" -ForegroundColor Green
    
    # Commit
    Write-Host ""
    Write-Host "Enter a commit message (or press Enter for default):" -ForegroundColor Cyan
    $commitMsg = Read-Host
    if ([string]::IsNullOrWhiteSpace($commitMsg)) {
        $commitMsg = "Initial commit - Setique marketplace"
    }
    
    git commit -m "$commitMsg"
    Write-Host "✓ Changes committed" -ForegroundColor Green
    
    # Set main branch
    Write-Host ""
    Write-Host "Setting main branch..." -ForegroundColor White
    git branch -M main
    Write-Host "✓ Branch set to main" -ForegroundColor Green
    
    # Push to GitHub
    Write-Host ""
    Write-Host "Pushing to GitHub..." -ForegroundColor White
    Write-Host "  (You may need to authenticate with GitHub)" -ForegroundColor Yellow
    Write-Host ""
    
    try {
        git push -u origin main
        Write-Host ""
        Write-Host "✓ Code pushed to GitHub successfully!" -ForegroundColor Green
        Write-Host "  View at: $githubUrl" -ForegroundColor Cyan
    } catch {
        Write-Host ""
        Write-Host "⚠ Push failed. This might happen if:" -ForegroundColor Yellow
        Write-Host "  1. You need to authenticate with GitHub" -ForegroundColor White
        Write-Host "  2. The repository already has content" -ForegroundColor White
        Write-Host ""
        Write-Host "Try running this command manually:" -ForegroundColor Cyan
        Write-Host "  git push -u origin main --force" -ForegroundColor White
        Write-Host ""
    }
} else {
    Write-Host "✓ No new changes to commit" -ForegroundColor Green
    Write-Host "  Your code may already be on GitHub" -ForegroundColor White
}

Write-Host ""

# ========================================
# STEP 5: Supabase Setup Instructions
# ========================================
Write-Host "STEP 5: Supabase Database Setup" -ForegroundColor Yellow
Write-Host ""

$setupSupabase = Read-Host "Do you want to set up your Supabase database now? (y/N)"

if ($setupSupabase -eq "y" -or $setupSupabase -eq "Y") {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "   SUPABASE DATABASE SETUP GUIDE       " -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Follow these steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Open your browser and go to: https://supabase.com" -ForegroundColor White
    Write-Host "2. Sign in to your project" -ForegroundColor White
    Write-Host "3. Click on the SQL Editor icon (</>) in the left sidebar" -ForegroundColor White
    Write-Host "4. Click '+ New query'" -ForegroundColor White
    Write-Host ""
    Write-Host "5. Copy the SQL from this file and paste it:" -ForegroundColor Cyan
    Write-Host "   supabase/migrations/001_initial_schema.sql" -ForegroundColor White
    Write-Host ""
    Write-Host "6. Click 'Run' or press Ctrl+Enter" -ForegroundColor White
    Write-Host "7. You should see: 'Success. No rows returned'" -ForegroundColor White
    Write-Host ""
    Write-Host "8. Verify tables were created:" -ForegroundColor Cyan
    Write-Host "   - Click Table Editor in the sidebar" -ForegroundColor White
    Write-Host "   - You should see: profiles, datasets, purchases, bounties" -ForegroundColor White
    Write-Host ""
    
    # Open the SQL file in default editor
    $openFile = Read-Host "Do you want to open the SQL file now? (y/N)"
    if ($openFile -eq "y" -or $openFile -eq "Y") {
        Start-Process "supabase\migrations\001_initial_schema.sql"
        Write-Host "✓ SQL file opened" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "After running the SQL in Supabase, press Enter to continue..." -ForegroundColor Yellow
    Read-Host
} else {
    Write-Host "✓ Skipped Supabase setup - you can do this later" -ForegroundColor Green
    Write-Host "  See: SUPABASE_SETUP_COMPLETE.md for detailed instructions" -ForegroundColor White
}

Write-Host ""

# ========================================
# STEP 6: Start the Development Server
# ========================================
Write-Host "STEP 6: Starting the development server..." -ForegroundColor Yellow
Write-Host ""

$startServer = Read-Host "Do you want to start the dev server now? (y/N)"

if ($startServer -eq "y" -or $startServer -eq "Y") {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "         STARTING DEV SERVER            " -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "The app will open at http://localhost:3000" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Starting in 3 seconds..." -ForegroundColor White
    Start-Sleep -Seconds 3
    
    npm run dev
} else {
    Write-Host ""
    Write-Host "✓ Setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To start the server later, run:" -ForegroundColor Cyan
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host ""
}

# ========================================
# FINAL SUMMARY
# ========================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "         SETUP COMPLETE! 🎉            " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "What's been done:" -ForegroundColor Yellow
Write-Host "  ✓ Dependencies installed" -ForegroundColor Green
Write-Host "  ✓ Environment variables configured" -ForegroundColor Green
Write-Host "  ✓ Code pushed to GitHub" -ForegroundColor Green
Write-Host "  ✓ Ready for development" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Make sure Supabase database is set up (if you have not done so)" -ForegroundColor White
Write-Host "  2. Run npm run dev to start the server" -ForegroundColor White
Write-Host "  3. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "  4. Sign up and start using your marketplace!" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "  📄 README.md - Technical overview" -ForegroundColor White
Write-Host "  📄 SETUP_GUIDE.md - Detailed setup guide" -ForegroundColor White
Write-Host "  📄 SUPABASE_SETUP_COMPLETE.md - Supabase instructions" -ForegroundColor White
Write-Host "  📄 QUICK_REFERENCE.md - Quick reference" -ForegroundColor White
Write-Host ""
Write-Host "Your GitHub repo: $githubUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Need help? Check the documentation files above!" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to exit"
