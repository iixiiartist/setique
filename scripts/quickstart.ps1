# Quick Start Script for Windows
# Run this file by right-clicking and selecting "Run with PowerShell"

Write-Host "🚀 SETIQUE Quick Start Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking for Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org" -ForegroundColor Red
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

Write-Host ""

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host "✓ .env file found" -ForegroundColor Green
} else {
    Write-Host "⚠ .env file not found!" -ForegroundColor Yellow
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✓ Created .env file" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠ IMPORTANT: You need to edit .env with your actual API keys!" -ForegroundColor Red
    Write-Host "Open .env in a text editor and add your:" -ForegroundColor Red
    Write-Host "  - Supabase URL and API key" -ForegroundColor Red
    Write-Host "  - Stripe publishable and secret keys" -ForegroundColor Red
    Write-Host ""
    Write-Host "Press any key to continue..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

Write-Host ""

# Check if node_modules exists
if (Test-Path "node_modules") {
    Write-Host "✓ Dependencies already installed" -ForegroundColor Green
    Write-Host ""
    $install = Read-Host "Do you want to reinstall dependencies? (y/N)"
    if ($install -eq "y" -or $install -eq "Y") {
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        npm install
    }
} else {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    Write-Host "This may take 2-3 minutes..." -ForegroundColor Yellow
    npm install
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Make sure you've configured your .env file" -ForegroundColor White
Write-Host "2. Set up your Supabase database (see SETUP_GUIDE.md)" -ForegroundColor White
Write-Host "3. Run 'npm run dev' to start the development server" -ForegroundColor White
Write-Host ""
Write-Host "Do you want to start the dev server now? (y/N)" -ForegroundColor Yellow
$start = Read-Host

if ($start -eq "y" -or $start -eq "Y") {
    Write-Host ""
    Write-Host "Starting development server..." -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host ""
    npm run dev
} else {
    Write-Host ""
    Write-Host "To start the server later, run: npm run dev" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
