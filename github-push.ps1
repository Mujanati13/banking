# ========================================
# Banking Suite - GitHub Push Script
# Windows PowerShell Version
# ========================================
#
# This script helps you push your Banking Suite project to GitHub
#
# Usage:
#   1. Open PowerShell in the project folder
#   2. Run: .\github-push.ps1
#

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Banking Suite - GitHub Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Git is installed
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "✗ Git is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✓ Git is installed" -ForegroundColor Green

# Check if we're in the right directory
if (!(Test-Path "package.json")) {
    Write-Host "✗ package.json not found!" -ForegroundColor Red
    Write-Host "Please run this script from the Banking Suite project root folder" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Project folder detected" -ForegroundColor Green
Write-Host ""

# Initialize Git if not already initialized
if (!(Test-Path ".git")) {
    Write-Host "ℹ Initializing Git repository..." -ForegroundColor Blue
    git init
    git branch -M main
    Write-Host "✓ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "ℹ Git repository already exists" -ForegroundColor Blue
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GitHub Repository Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Choose an option:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1) Create new repository using GitHub CLI (recommended)" -ForegroundColor White
Write-Host "  2) Push to existing repository" -ForegroundColor White
Write-Host "  3) Cancel" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-3)"

switch ($choice) {
    "1" {
        # Option 1: Create new repo with GitHub CLI
        Write-Host ""
        Write-Host "Creating new repository with GitHub CLI..." -ForegroundColor Blue
        
        # Check if GitHub CLI is installed
        if (!(Get-Command gh -ErrorAction SilentlyContinue)) {
            Write-Host "✗ GitHub CLI not installed!" -ForegroundColor Red
            Write-Host ""
            Write-Host "Installing GitHub CLI..." -ForegroundColor Yellow
            Write-Host "Run this command: winget install GitHub.cli" -ForegroundColor Cyan
            Write-Host "Then run this script again" -ForegroundColor Yellow
            Write-Host ""
            exit 1
        }
        
        # Check if logged in
        $ghStatus = gh auth status 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ℹ Please login to GitHub..." -ForegroundColor Blue
            gh auth login
        }
        
        Write-Host ""
        $repoName = Read-Host "Enter repository name (default: banking-suite)"
        if ([string]::IsNullOrWhiteSpace($repoName)) {
            $repoName = "banking-suite"
        }
        
        Write-Host ""
        Write-Host "Creating private repository: $repoName" -ForegroundColor Blue
        
        # Add all files
        git add .
        
        # Create initial commit
        if (!(git log --oneline 2>&1 | Select-String "fatal")) {
            Write-Host "ℹ Repository already has commits" -ForegroundColor Blue
        } else {
            git commit -m "Initial commit - Banking Suite v1"
        }
        
        # Create repo and push
        gh repo create $repoName --private --source=. --push
        
        Write-Host ""
        Write-Host "✓ Repository created and code pushed!" -ForegroundColor Green
        Write-Host "View your repository: https://github.com/$(gh api user -q .login)/$repoName" -ForegroundColor Cyan
    }
    
    "2" {
        # Option 2: Push to existing repo
        Write-Host ""
        $repoUrl = Read-Host "Enter your GitHub repository URL (https://github.com/username/repo.git)"
        
        if ([string]::IsNullOrWhiteSpace($repoUrl)) {
            Write-Host "✗ Repository URL cannot be empty!" -ForegroundColor Red
            exit 1
        }
        
        # Check if remote already exists
        $existingRemote = git remote get-url origin 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "ℹ Remote 'origin' already exists: $existingRemote" -ForegroundColor Yellow
            $overwrite = Read-Host "Do you want to overwrite it? (y/n)"
            if ($overwrite -eq "y") {
                git remote remove origin
                git remote add origin $repoUrl
            }
        } else {
            git remote add origin $repoUrl
        }
        
        Write-Host ""
        Write-Host "ℹ Adding files to Git..." -ForegroundColor Blue
        git add .
        
        Write-Host "ℹ Creating commit..." -ForegroundColor Blue
        $commitMsg = Read-Host "Enter commit message (default: Initial commit)"
        if ([string]::IsNullOrWhiteSpace($commitMsg)) {
            $commitMsg = "Initial commit - Banking Suite v1"
        }
        
        git commit -m $commitMsg 2>&1 | Out-Null
        
        Write-Host "ℹ Pushing to GitHub..." -ForegroundColor Blue
        git push -u origin main
        
        Write-Host ""
        Write-Host "✓ Code pushed to GitHub!" -ForegroundColor Green
    }
    
    "3" {
        Write-Host ""
        Write-Host "Cancelled by user" -ForegroundColor Yellow
        exit 0
    }
    
    default {
        Write-Host ""
        Write-Host "✗ Invalid choice!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Next Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Review DEPLOYMENT_GUIDE.md for VPS setup instructions" -ForegroundColor White
Write-Host "2. Set up your Ubuntu 22.04 VPS" -ForegroundColor White
Write-Host "3. Install Dokploy on your VPS" -ForegroundColor White
Write-Host "4. Deploy from GitHub or upload ZIP file" -ForegroundColor White
Write-Host ""
Write-Host "✓ GitHub setup complete!" -ForegroundColor Green
Write-Host ""
