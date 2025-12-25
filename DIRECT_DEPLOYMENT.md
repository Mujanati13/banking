# 🚀 Direct VPS Deployment Guide (Without Dokploy)

Deploy Banking Suite directly to your VPS using Docker + Nginx.

---

## Quick Deployment (5 Minutes)

### Step 1: Prepare Your VPS

Requirements:
- Ubuntu 22.04 VPS (2GB RAM minimum)
- Root access
- Domain pointing to your VPS IP

### Step 2: Upload Project to VPS

**Option A: From GitHub** (Recommended)

```bash
# On your local machine, push to GitHub first
cd C:\Users\fg\Desktop\banking
git add .
git commit -m "Ready for deployment"
git push origin main
```

**Option B: Direct Upload via SCP**

```powershell
# On Windows PowerShell
scp -r C:\Users\fg\Desktop\banking\* root@YOUR_SERVER_IP:/opt/banking-suite/
```

### Step 3: Run Deployment Script

SSH into your VPS:

```bash
ssh root@YOUR_SERVER_IP

# Download deployment script
wget https://raw.githubusercontent.com/YOUR_USERNAME/banking-suite/main/vps-direct-deploy.sh

# Make executable
chmod +x vps-direct-deploy.sh

# Run deployment
./vps-direct-deploy.sh
```

The script will ask for:
- Your domain name
- Admin username (default: admin)
- Admin password
- Admin email
- Whether to clone from GitHub

### Step 4: Access Your Application

After deployment completes (5-10 minutes):

- **Admin Panel**: `https://yourdomain.com/admin`
- **Login**: Use credentials you provided during setup

---

## Manual Deployment Steps

If you prefer manual control, follow these steps:

### 1. Install Docker

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker
```

### 2. Install Nginx & Certbot

```bash
apt install -y nginx certbot python3-certbot-nginx
```

### 3. Upload Your Project

```bash
# Create directory
mkdir -p /opt/banking-suite
cd /opt/banking-suite

# Option A: Clone from GitHub
git clone https://github.com/YOUR_USERNAME/banking-suite.git .

# Option B: Upload via SCP (from your Windows machine)
# scp -r C:\Users\fg\Desktop\banking\* root@YOUR_IP:/opt/banking-suite/
```

### 4. Create Environment File

```bash
cat > /opt/banking-suite/.env.production <<'EOF'
# ⚠️ CUSTOMIZE THESE VALUES

# Admin Credentials
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourStrongPassword123!
ADMIN_USERNAME=admin

# URLs - Replace yourdomain.com with your actual domain
CLIENT_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
SERVER_URL=https://yourdomain.com:3001
TEMPLATE_BASE_URL=https://yourdomain.com
BACKEND_URL=http://localhost:3001

# Database
DB_PATH=/app/data/database.sqlite

# Security Keys - Generate these!
JWT_SECRET=$(openssl rand -hex 64)
SESSION_SECRET=$(openssl rand -hex 64)
ENCRYPTION_KEY=$(openssl rand -hex 16)
ENCRYPTION_IV=$(openssl rand -hex 8)

# Server Configuration
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
TRUST_PROXY=true

# Email
DEFAULT_FROM_EMAIL=no-reply@yourdomain.com
DEFAULT_FROM_NAME=Multi-Banking Panel
EMAIL_FROM=no-reply@yourdomain.com

# File Uploads
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=10485760

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Session
SESSION_EXPIRE_HOURS=24
EOF

# Secure the file
chmod 600 /opt/banking-suite/.env.production
```

### 5. Build Docker Image

```bash
cd /opt/banking-suite
docker build -t banking-suite:latest -f Dockerfile .
```

This takes 5-10 minutes.

### 6. Run Container

```bash
docker run -d \
    --name banking-suite \
    --restart unless-stopped \
    -p 127.0.0.1:8080:80 \
    -v banking-data:/app/data \
    -v banking-uploads:/app/uploads \
    -v banking-logs:/app/logs \
    --env-file /opt/banking-suite/.env.production \
    banking-suite:latest
```

### 7. Configure Nginx

```bash
# Stop Apache if running
systemctl stop apache2 2>/dev/null
systemctl disable apache2 2>/dev/null

# Create Nginx config
cat > /etc/nginx/sites-available/banking-suite <<'EOF'
server {
    listen 80;
    server_name yourdomain.com;  # ⚠️ Change this

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/banking-suite /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart
nginx -t
systemctl restart nginx
```

### 8. Setup SSL

```bash
# Configure firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Get SSL certificate
certbot --nginx -d yourdomain.com --email admin@yourdomain.com --agree-tos --non-interactive --redirect

# Enable auto-renewal
systemctl enable certbot.timer
systemctl start certbot.timer
```

---

## 🔄 Update Application

When you have new changes:

```bash
# Pull latest code
cd /opt/banking-suite
git pull

# Rebuild image
docker build -t banking-suite:latest .

# Stop and remove old container
docker stop banking-suite
docker rm banking-suite

# Start new container
docker run -d \
    --name banking-suite \
    --restart unless-stopped \
    -p 127.0.0.1:8080:80 \
    -v banking-data:/app/data \
    -v banking-uploads:/app/uploads \
    -v banking-logs:/app/logs \
    --env-file /opt/banking-suite/.env.production \
    banking-suite:latest
```

---

## 📊 Management Commands

### View Logs

```bash
# Application logs
docker logs -f banking-suite

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Restart Application

```bash
docker restart banking-suite
```

### Backup Database

```bash
# Create backup directory
mkdir -p /backups

# Backup database
docker cp banking-suite:/app/data/database.sqlite /backups/db-$(date +%Y%m%d-%H%M).sqlite

# Backup uploads
docker cp banking-suite:/app/uploads /backups/uploads-$(date +%Y%m%d-%H%M)
```

### Restore Database

```bash
# Stop container
docker stop banking-suite

# Restore database
docker cp /backups/db-20251225-1200.sqlite banking-suite:/app/data/database.sqlite

# Start container
docker start banking-suite
```

---

## 🛠️ Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs banking-suite

# Check if port is in use
lsof -i :8080

# Remove and recreate
docker stop banking-suite
docker rm banking-suite
# Then re-run docker run command
```

### Can't Access Website

```bash
# Check container is running
docker ps

# Check Nginx
nginx -t
systemctl status nginx

# Check firewall
ufw status

# Test connection
curl http://localhost:8080
```

### SSL Certificate Issues

```bash
# Renew manually
certbot renew

# Check expiry
certbot certificates

# Force renewal
certbot renew --force-renewal
```

---

## 🔒 Security Checklist

- [ ] Strong admin password set
- [ ] Firewall enabled (ufw)
- [ ] SSH key authentication configured
- [ ] Root login disabled
- [ ] SSL certificate active
- [ ] Regular backups scheduled
- [ ] System updates automated
- [ ] Fail2ban installed (optional)

---

## 📈 Performance Tuning

### Enable Swap (for VPS with < 4GB RAM)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Optimize Docker

```bash
# Add to /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

# Restart Docker
systemctl restart docker
```

---

## 📋 Comparison: Direct vs Dokploy

| Feature | Direct Deployment | Dokploy |
|---------|------------------|---------|
| **Setup Time** | 10-15 min | 5-10 min |
| **Complexity** | Medium | Easy |
| **Control** | Full control | Abstracted |
| **Updates** | Manual rebuild | One-click |
| **SSL** | Manual certbot | Automatic |
| **Monitoring** | Manual (logs) | Built-in dashboard |
| **Multi-app** | Manual Nginx config | Easy |
| **Best for** | Single app, full control | Multiple apps, simplicity |

---

## ✅ Direct Deployment Benefits

✅ **No dependencies** - Just Docker + Nginx  
✅ **Full control** - Customize everything  
✅ **Lightweight** - No extra management layer  
✅ **Standard tools** - Docker, Nginx, Certbot  
✅ **Easy backup** - Direct Docker volumes  

---

**Ready to deploy?** Run the automated script or follow manual steps above!
