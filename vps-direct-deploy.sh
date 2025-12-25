#!/bin/bash

###############################################################################
# Banking Suite - Direct VPS Deployment (Without Dokploy)
# 
# This script deploys the Banking Suite directly to Ubuntu 22.04 using Docker
#
# Usage:
#   1. SSH into your Ubuntu 22.04 VPS
#   2. wget https://raw.githubusercontent.com/YOUR_USERNAME/banking-suite/main/vps-direct-deploy.sh
#   3. chmod +x vps-direct-deploy.sh
#   4. ./vps-direct-deploy.sh
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo ""
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root or use sudo"
    exit 1
fi

# Welcome
clear
print_header "Banking Suite - Direct VPS Deployment"
print_info "This will deploy Banking Suite directly using Docker (no Dokploy)"
echo ""

# Get configuration
print_header "Configuration"
read -p "Enter your domain [bankingsuite.magicsuite.pro]: " DOMAIN
DOMAIN=${DOMAIN:-bankingsuite.magicsuite.pro}

read -p "Enter admin username [admin]: " ADMIN_USERNAME
ADMIN_USERNAME=${ADMIN_USERNAME:-admin}

read -sp "Enter admin password [qz^X5rp%KjH2SRlo]: " ADMIN_PASSWORD
echo ""
ADMIN_PASSWORD=${ADMIN_PASSWORD:-'qz^X5rp%KjH2SRlo'}

read -p "Enter admin email [admin@magicsuite.pro]: " ADMIN_EMAIL
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@magicsuite.pro}

read -p "Clone from GitHub? (y/n) [n]: " USE_GITHUB
USE_GITHUB=${USE_GITHUB:-n}

if [ "$USE_GITHUB" = "y" ]; then
    read -p "Enter GitHub repo URL (https://github.com/user/repo.git): " GITHUB_REPO
fi

# Security keys (pre-configured or generate new)
print_header "Security Keys Configuration"
read -p "Use pre-configured keys? (y/n) [y]: " USE_PRECONFIG_KEYS
USE_PRECONFIG_KEYS=${USE_PRECONFIG_KEYS:-y}

if [ "$USE_PRECONFIG_KEYS" = "y" ]; then
    JWT_SECRET="554904df7d390d8d0ad2271b053ce66c53a05a11c7190dfbfae3c91fe08eb6c1f47e8f6aab29e459e4ee0549276dee63217416d66a39746899d9ec7c787a10c4"
    SESSION_SECRET="bd085aa9ce1900699150ff23e490614d3c98e4fd1213e304da544bd14d0a04d838012cc1bc4e742c30053fabd104efb9fc8b65b172d94835a97c3b2009f604c0"
    ENCRYPTION_KEY="428944a9164c2838be9d5f9c0a124537"
    ENCRYPTION_IV="4f37f6e7a72432ad"
    print_success "Using pre-configured security keys"
else
    print_info "Generating new security keys..."
    JWT_SECRET=$(openssl rand -hex 64)
    SESSION_SECRET=$(openssl rand -hex 64)
    ENCRYPTION_KEY=$(openssl rand -hex 16)
    ENCRYPTION_IV=$(openssl rand -hex 8)
    print_success "New security keys generated"
fi

# Step 1: Update System
print_header "Step 1: Updating System"
apt update -y
DEBIAN_FRONTEND=noninteractive apt upgrade -y
apt install -y curl wget git unzip htop nano ufw nginx certbot python3-certbot-nginx
print_success "System updated"

# Step 2: Install Docker
print_header "Step 2: Installing Docker"
if ! command -v docker &> /dev/null; then
    print_info "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    rm get-docker.sh
    print_success "Docker installed"
else
    print_success "Docker already installed"
fi

# Step 3: Configure Firewall
print_header "Step 3: Configuring Firewall"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
print_success "Firewall configured"

# Step 4: Get Application Files
print_header "Step 4: Getting Application Files"
APP_DIR="/opt/banking-suite"
mkdir -p $APP_DIR
cd $APP_DIR

if [ "$USE_GITHUB" = "y" ]; then
    print_info "Cloning from GitHub..."
    git clone $GITHUB_REPO .
    print_success "Repository cloned"
else
    print_warning "Please upload your project files to: $APP_DIR"
    print_info "You can use: scp -r /path/to/banking/* root@$DOMAIN:$APP_DIR/"
    read -p "Press Enter when files are uploaded..."
fi

# Step 5: Create Environment File
print_header "Step 5: Creating Environment Configuration"
cat > $APP_DIR/.env.production <<EOF
# Admin Credentials
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
ADMIN_USERNAME=$ADMIN_USERNAME

# URLs
CLIENT_URL=https://$DOMAIN
CORS_ORIGIN=https://$DOMAIN
SERVER_URL=https://$DOMAIN:3001
TEMPLATE_BASE_URL=https://$DOMAIN
BACKEND_URL=http://backend:3001

# Database
DB_PATH=/app/data/database.sqlite

# Security Keys
JWT_SECRET=$JWT_SECRET
SESSION_SECRET=$SESSION_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY
ENCRYPTION_IV=$ENCRYPTION_IV

# Server Configuration
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
TRUST_PROXY=true

# Email
DEFAULT_FROM_EMAIL=no-reply@${DOMAIN#*.}
DEFAULT_FROM_NAME=Multi-Banking Panel
EMAIL_FROM=no-reply@${DOMAIN#*.}

# File Uploads
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=10485760

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Session
SESSION_EXPIRE_HOURS=24
EOF

chmod 600 $APP_DIR/.env.production
print_success "Environment file created"

# Step 6: Build Docker Image
print_header "Step 6: Building Docker Image"
print_info "This may take 5-10 minutes..."
docker build -t banking-suite:latest -f $APP_DIR/Dockerfile $APP_DIR
print_success "Docker image built"

# Step 7: Stop Old Container (if exists)
print_header "Step 7: Cleaning Up Old Containers"
if docker ps -a | grep -q banking-suite; then
    print_info "Stopping old container..."
    docker stop banking-suite 2>/dev/null || true
    docker rm banking-suite 2>/dev/null || true
    print_success "Old container removed"
fi

# Step 8: Start Application Container
print_header "Step 8: Starting Application"
docker run -d \
    --name banking-suite \
    --restart unless-stopped \
    -p 127.0.0.1:8080:80 \
    -v banking-data:/app/data \
    -v banking-uploads:/app/uploads \
    -v banking-logs:/app/logs \
    --env-file $APP_DIR/.env.production \
    banking-suite:latest

sleep 5

if docker ps | grep -q banking-suite; then
    print_success "Application started successfully"
else
    print_error "Failed to start application"
    print_info "Check logs: docker logs banking-suite"
    exit 1
fi

# Step 9: Configure Nginx
print_header "Step 9: Configuring Nginx"

# Stop any existing web servers
systemctl stop apache2 2>/dev/null || true
systemctl disable apache2 2>/dev/null || true

cat > /etc/nginx/sites-available/banking-suite <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/banking-suite /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl restart nginx
print_success "Nginx configured"

# Step 10: Setup SSL
print_header "Step 10: Setting Up SSL Certificate"
print_info "Obtaining Let's Encrypt SSL certificate..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $ADMIN_EMAIL --redirect

if [ $? -eq 0 ]; then
    print_success "SSL certificate installed"
else
    print_warning "SSL setup failed. You can run manually: certbot --nginx -d $DOMAIN"
fi

# Step 11: Setup Auto-renewal
print_header "Step 11: Configuring SSL Auto-Renewal"
systemctl enable certbot.timer
systemctl start certbot.timer
print_success "SSL auto-renewal configured"

# Get Server IP
SERVER_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "Unable to detect")

# Final Summary
print_header "✅ Deployment Complete!"
echo ""
print_success "Banking Suite is now running!"
echo ""
print_info "Access Information:"
echo "  • Admin Panel: ${GREEN}https://$DOMAIN/admin${NC}"
echo "  • Username: ${GREEN}$ADMIN_USERNAME${NC}"
echo "  • Password: ${GREEN}$ADMIN_PASSWORD${NC}"
echo "  • Server IP: ${GREEN}$SERVER_IP${NC}"
echo ""
print_warning "Important:"
echo "  • Save your credentials securely"
echo "  • The main page shows 403 (anti-bot protection - this is normal)"
echo "  • Add spam domains in admin panel"
echo ""
print_info "Useful Commands:"
echo "  • View logs: docker logs -f banking-suite"
echo "  • Restart app: docker restart banking-suite"
echo "  • Stop app: docker stop banking-suite"
echo "  • Start app: docker start banking-suite"
echo "  • Rebuild: docker build -t banking-suite:latest $APP_DIR"
echo "  • Check status: docker ps"
echo "  • Nginx logs: tail -f /var/log/nginx/error.log"
echo ""
print_info "Update Application:"
echo "  cd $APP_DIR"
echo "  git pull  # if using GitHub"
echo "  docker build -t banking-suite:latest ."
echo "  docker stop banking-suite"
echo "  docker rm banking-suite"
echo "  # Then re-run the docker run command from Step 8"
echo ""
print_header "Deployment Script Completed!"
echo ""
