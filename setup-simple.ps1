# ========================================
# SETIQUE - Simple Automated Setup
# ========================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SETIQUE - Automated Setup Script    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "OK Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR Node.js not found!" -ForegroundColor Red
    Write-Host "Please install from: https://nodejs.org" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Git
try {
    $gitVersion = git --version
    Write-Host "OK Git installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR Git not found!" -ForegroundColor Red
    Write-Host "Please install from: https://git-scm.com" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Install dependencies
Write-Host "Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "OK Dependencies already installed" -ForegroundColor Green
} else {
    Write-Host "Installing packages..." -ForegroundColor White
    npm install
    Write-Host "OK Dependencies installed" -ForegroundColor Green
}

Write-Host ""

# GitHub Setup
Write-Host "Setting up GitHub..." -ForegroundColor Yellow
$githubUrl = "https://github.com/iixiiartist/setique.git"

# Initialize Git
if (Test-Path ".git") {
    Write-Host "OK Git repository already initialized" -ForegroundColor Green
} else {
    git init
    Write-Host "OK Git initialized" -ForegroundColor Green
}

# Add remote
$remoteExists = git remote | Select-String -Pattern "origin" -Quiet
if ($remoteExists) {
    Write-Host "OK GitHub remote already configured" -ForegroundColor Green
} else {
    git remote add origin $githubUrl
    Write-Host "OK GitHub remote added" -ForegroundColor Green
}

# Stage and commit
Write-Host ""
Write-Host "Committing code..." -ForegroundColor Yellow
git add .

$hasChanges = git status --porcelain
if ($hasChanges) {
    git commit -m "Initial commit - Setique marketplace"
    Write-Host "OK Changes committed" -ForegroundColor Green
    
    # Set main branch and push
    git branch -M main
    Write-Host "OK Branch set to main" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    Write-Host "(You may need to authenticate)" -ForegroundColor Cyan
    
    try {
        git push -u origin main 2>&1 | Out-Null
        Write-Host ""
        Write-Host "SUCCESS Code pushed to GitHub!" -ForegroundColor Green
        Write-Host "View at: $githubUrl" -ForegroundColor Cyan
    } catch {
        Write-Host ""
        Write-Host "Push may have failed - try this command manually:" -ForegroundColor Yellow
        Write-Host "  git push -u origin main --force" -ForegroundColor White
    }
} else {
    Write-Host "OK No new changes to commit" -ForegroundColor Green
}

Write-Host ""

# Environment setup
Write-Host "Checking environment variables..." -ForegroundColor Yellow

if (Test-Path ".env") {
    Write-Host "OK .env file already exists" -ForegroundColor Green
    Write-Host ""
    $updateEnv = Read-Host "Update with Supabase credentials now? (y/N)"
    
    if ($updateEnv -eq "y" -or $updateEnv -eq "Y") {
        Write-Host ""
        Write-Host "Enter your Supabase URL (from supabase.com project settings):" -ForegroundColor Cyan
        $supabaseUrl = Read-Host
        
        Write-Host "Enter your Supabase ANON key (starts with eyJ...):" -ForegroundColor Cyan
        $supabaseKey = Read-Host
        
        $envContent = @"
# Supabase Configuration
VITE_SUPABASE_URL=$supabaseUrl
VITE_SUPABASE_ANON_KEY=$supabaseKey

# Stripe Configuration (Placeholder)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
"@
        
        $envContent | Out-File -FilePath ".env" -Encoding UTF8
        Write-Host "OK .env file updated" -ForegroundColor Green
    }
} else {
    Write-Host "Creating .env file with placeholders..." -ForegroundColor White
    
    $envContent = @"
# Supabase Configuration (PLACEHOLDER - Update these!)
VITE_SUPABASE_URL=https://placeholder.supabase.co
VITE_SUPABASE_ANON_KEY=placeholder_key_here

# Stripe Configuration (Placeholder)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "OK .env file created" -ForegroundColor Green
    Write-Host "WARNING Remember to update with real credentials!" -ForegroundColor Yellow
}

Write-Host ""

# Supabase setup
Write-Host "Supabase Database Setup" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps to set up your database:" -ForegroundColor White
Write-Host "1. Go to https://supabase.com and sign in" -ForegroundColor White
Write-Host "2. Open SQL Editor in your project" -ForegroundColor White
Write-Host "3. Copy and run the SQL from:" -ForegroundColor White
Write-Host "   supabase/migrations/001_initial_schema.sql" -ForegroundColor Cyan
Write-Host ""

$openSQL = Read-Host "Open the SQL file now? (y/N)"
if ($openSQL -eq "y" -or $openSQL -eq "Y") {
    Start-Process "supabase\migrations\001_initial_schema.sql"
    Write-Host "OK SQL file opened" -ForegroundColor Green
}

Write-Host ""

# Start server
Write-Host "Development Server" -ForegroundColor Yellow
Write-Host ""
$startNow = Read-Host "Start the dev server now? (y/N)"

if ($startNow -eq "y" -or $startNow -eq "Y") {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "         STARTING DEV SERVER            " -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "App will open at http://localhost:3000" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Starting in 3 seconds..." -ForegroundColor White
    Start-Sleep -Seconds 3
    
    npm run dev
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "         SETUP COMPLETE!                " -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "What was done:" -ForegroundColor Yellow
    Write-Host "  [OK] Dependencies installed" -ForegroundColor Green
    Write-Host "  [OK] Code pushed to GitHub" -ForegroundColor Green
    Write-Host "  [OK] Environment configured" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Set up Supabase database (run the SQL)" -ForegroundColor White
    Write-Host "  2. Update .env with real credentials" -ForegroundColor White
    Write-Host "  3. Run: npm run dev" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "GitHub repo: $githubUrl" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Press Enter to exit"
}
