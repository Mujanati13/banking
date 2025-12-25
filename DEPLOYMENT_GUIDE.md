# 🚀 Banking Suite - Complete Deployment Guide

Complete step-by-step guide to deploy Banking Suite from development to production using Dokploy on Ubuntu 22.04.

---

## 📋 Prerequisites

- Ubuntu 22.04 VPS (2GB RAM minimum, 4GB recommended)
- Domain name with DNS access
- SSH access to your server
- Git installed locally
- GitHub account

---

## Part 1️⃣: Push Project to GitHub

### Step 1: Initialize Git Repository

```powershell
# Navigate to project folder
cd C:\Users\fg\Desktop\banking

# Initialize Git (if not already initialized)
git init

# Check current status
git status
```

### Step 2: Create GitHub Repository

**Option A: Using GitHub CLI (recommended)**

```powershell
# Install GitHub CLI if not installed
winget install GitHub.cli

# Login to GitHub
gh auth login

# Create private repository and push
gh repo create banking-suite --private --source=. --push
```

**Option B: Manual Setup**

1. Go to https://github.com/new
2. Repository name: `banking-suite`
3. Set to **Private**
4. Do **NOT** initialize with README
5. Click **Create repository**

Then run:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/banking-suite.git
git branch -M main
git add .
git commit -m "Initial commit - Banking Suite v1"
git push -u origin main
```

### Step 3: Verify Push

Visit your repository on GitHub to confirm all files are uploaded (except files in `.gitignore`).

---

## Part 2️⃣: VPS Setup (Ubuntu 22.04)

### Step 1: Initial Server Configuration

```bash
# SSH into your VPS
ssh root@YOUR_SERVER_IP

# Update system packages
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget git unzip htop nano ufw

# Set timezone (optional)
timedatectl set-timezone Europe/Berlin
# Or use your timezone: timedatectl list-timezones
```

### Step 2: Configure Firewall

```bash
# Allow essential ports
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw allow 3000/tcp    # Dokploy Dashboard

# Enable firewall
ufw --force enable

# Check status
ufw status
```

### Step 3: Install Dokploy

```bash
# Run Dokploy installation script
curl -sSL https://dokploy.com/install.sh | sh
```

**Wait 3-5 minutes** for installation to complete. You'll see a success message with the dashboard URL.

### Step 4: Verify Installation

```bash
# Check if Dokploy is running
docker ps

# You should see Dokploy containers running
```

---

## Part 3️⃣: Dokploy Dashboard Configuration

### Step 1: Access Dokploy Dashboard

1. Open browser: `http://YOUR_SERVER_IP:3000`
2. Create your Dokploy admin account:
   - Username: `admin` (or your choice)
   - Password: Use a strong password
   - Email: Your email

⚠️ **Note**: This is your Dokploy admin account, separate from the Banking Suite admin.

### Step 2: Create Application Project

1. Click **Projects** in sidebar
2. Click **New** button
3. Click **Application** card
4. Fill in details:
   - **Name**: `BankingSuite` (or any name)
   - **Description**: Banking Suite Application (optional)
5. Click **Create**

### Step 3: Configure Build Settings

In the **General** tab:

1. Scroll down to **Build Pack** section
2. Select: **Dockerfile** from dropdown
3. In the **Dockerfile Path** field, enter: `/Dockerfile`
4. Click **Save** button

### Step 4: Configure Domain & SSL

In the **Domain** tab:

1. Click **Add Domain** button
2. Enter your domain: `bankingsuite.magicsuite.pro` (replace with yours)
   - You can use subdomain: `panel.yourdomain.com`
   - Or root domain: `yourdomain.com`
3. Set **Port**: `80`
4. **SSL**: Select `Let's Encrypt` from dropdown
5. Click **Save**

⚠️ **Important**: Make sure DNS is already pointing to your server IP before enabling SSL.

### Step 5: Set Environment Variables

In the **Environment** tab:

1. Click **Add Variable** or paste in bulk mode
2. Copy the template from `DOKPLOY_ENV.txt` (see next section)
3. **Customize** the following values:

**MUST CHANGE:**
- `ADMIN_EMAIL` - Your admin email
- `ADMIN_PASSWORD` - Strong password (save it!)
- `ADMIN_USERNAME` - Your admin username
- `CLIENT_URL` - Your actual domain (e.g., `https://yourdomain.com`)
- `CORS_ORIGIN` - Same as CLIENT_URL
- `SERVER_URL` - Same as CLIENT_URL with :3001
- `TEMPLATE_BASE_URL` - Same as CLIENT_URL
- `DEFAULT_FROM_EMAIL` - Your domain email
- `JWT_SECRET` - Generate using provided script
- `SESSION_SECRET` - Generate using provided script
- `ENCRYPTION_KEY` - Exactly 32 hex characters
- `ENCRYPTION_IV` - Exactly 16 hex characters

4. Click **Save**

### Step 6: Deploy Application

**Option A: Deploy from GitHub (Recommended)**

1. In **General** tab, find **Provider** section
2. Select **GitHub**
3. Connect your GitHub account
4. Select repository: `banking-suite`
5. Select branch: `main`
6. Click **Deploy**

**Option B: Deploy from ZIP File**

1. Create ZIP file of your project:
   ```powershell
   Compress-Archive -Path "C:\Users\fg\Desktop\banking\*" -DestinationPath "C:\Users\fg\Desktop\BankingSuite-v1.zip"
   ```
2. In **General** tab, find **Provider** section
3. Select **Drop** (last option)
4. Upload `BankingSuite-v1.zip`
5. Click **Deploy**

### Step 7: Monitor Deployment

1. Watch the **Logs** tab for build progress
2. Deployment takes **5-10 minutes**
3. Status will turn **green** when complete
4. Look for: `✓ Build successful` message

---

## Part 4️⃣: DNS Configuration

Configure DNS at your domain registrar (Namecheap, Cloudflare, etc.):

### Required DNS Records

| Type | Name | Value | TTL | Purpose |
|------|------|-------|-----|---------|
| A | `@` or `bankingsuite` | `YOUR_SERVER_IP` | 300 | Admin panel domain |
| A | `*` (wildcard) | `YOUR_SERVER_IP` | 300 | Spam/phishing domains |

### Example (if using subdomain):

```
Type: A
Name: bankingsuite
Value: 123.45.67.89
TTL: 300
```

### Example (if using root domain):

```
Type: A  
Name: @
Value: 123.45.67.89
TTL: 300
```

**Wait 5-15 minutes** for DNS propagation.

---

## Part 5️⃣: Access Your Application

### Admin Dashboard

1. **URL**: `https://yourdomain.com/admin`
2. **Login** with credentials from environment variables:
   - Username: Value of `ADMIN_USERNAME`
   - Password: Value of `ADMIN_PASSWORD`

### Main Page (Expected Behavior)

- **URL**: `https://yourdomain.com/`
- **Result**: 403 Error or blocked page
- **This is NORMAL**: Anti-bot protection is active

---

## Part 6️⃣: Post-Deployment Configuration

### Add Spam/Phishing Domains

1. Login to admin dashboard
2. Navigate to **Domains** section
3. Click **Add Domain**
4. Enter spam domain (e.g., `bank-verify-secure.com`)
5. Configure templates for each domain

⚠️ **Keep spam domains separate** from your admin panel domain.

### Configure Email Settings (Optional)

1. Go to **Settings** in admin panel
2. Configure SMTP settings:
   - SMTP Host
   - SMTP Port
   - SMTP Username/Password
3. Or use Resend API key if preferred

---

## 🔧 Maintenance & Troubleshooting

### View Application Logs

```bash
# SSH into server
ssh root@YOUR_SERVER_IP

# List containers
docker ps

# View logs (replace CONTAINER_ID)
docker logs -f CONTAINER_ID

# Or in Dokploy Dashboard -> Logs tab
```

### Restart Application

In Dokploy Dashboard:
1. Go to your application
2. Click **Actions** → **Restart**

Or via SSH:
```bash
docker restart CONTAINER_ID
```

### Update Application

**From GitHub:**
1. Push changes to GitHub
2. In Dokploy → Click **Redeploy**

**From ZIP:**
1. Upload new ZIP file
2. Click **Deploy**

### Backup Database

```bash
# SSH into server
ssh root@YOUR_SERVER_IP

# Find container
docker ps

# Copy database (replace CONTAINER_ID)
docker cp CONTAINER_ID:/app/data/database.sqlite ~/backup-$(date +%Y%m%d).sqlite
```

### Check Disk Space

```bash
df -h
```

### Check Memory Usage

```bash
free -m
htop
```

### Common Issues

#### 1. Port 3000 blocked
```bash
ufw allow 3000/tcp
```

#### 2. SSL Certificate fails
- Check DNS is pointing to server
- Wait 10 minutes after DNS changes
- Try manual certificate in Dokploy

#### 3. Application won't start
- Check logs in Dokploy
- Verify environment variables
- Check ENCRYPTION_KEY is exactly 32 hex chars
- Check ENCRYPTION_IV is exactly 16 hex chars

#### 4. Can't login to admin
- Verify ADMIN_USERNAME and ADMIN_PASSWORD in environment
- Check database was created: `docker exec CONTAINER ls /app/data/`

---

## 📊 Performance Optimization

### Recommended VPS Specs

| Users | RAM | CPU | Storage |
|-------|-----|-----|---------|
| Small (1-10) | 2GB | 1 core | 20GB |
| Medium (10-50) | 4GB | 2 cores | 40GB |
| Large (50+) | 8GB | 4 cores | 80GB |

### Enable Swap (if RAM < 4GB)

```bash
# Create 2GB swap
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## 🔐 Security Best Practices

1. ✅ Use strong passwords (min 16 characters)
2. ✅ Enable UFW firewall
3. ✅ Keep system updated: `apt update && apt upgrade`
4. ✅ Use SSH keys instead of passwords
5. ✅ Enable 2FA on GitHub
6. ✅ Regular database backups
7. ✅ Monitor logs for suspicious activity
8. ✅ Use separate domain for admin panel

---

## 📞 Support & Resources

- **Dokploy Docs**: https://docs.dokploy.com
- **Docker Docs**: https://docs.docker.com
- **Ubuntu Server Guide**: https://ubuntu.com/server/docs

---

## ✅ Deployment Checklist

- [ ] VPS with Ubuntu 22.04 provisioned
- [ ] Dokploy installed and accessible
- [ ] Project pushed to GitHub (private repo)
- [ ] DNS records configured
- [ ] Environment variables customized
- [ ] Application deployed successfully
- [ ] SSL certificate active
- [ ] Admin dashboard accessible
- [ ] Admin login working
- [ ] Spam domains added
- [ ] Database backup configured
- [ ] Firewall rules set

---

**Last Updated**: December 25, 2025
**Version**: 1.0
