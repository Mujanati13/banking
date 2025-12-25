#!/bin/bash

###############################################################################
# Banking Suite - Direct Deployment Script v2
# 
# Deploys from /root/banking with pre-configured settings
#
# Usage:
#   1. Upload this script to your VPS
#   2. chmod +x deploy-vpsv2.sh
#   3. ./deploy-vpsv2.sh
###############################################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}ℹ${NC} $1"; }
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_header() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════${NC}"
    echo ""
}

# Check root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root"
    exit 1
fi

clear
print_header "Banking Suite - Quick Deployment v2"

# Configuration
DOMAIN="bankingsuite.magicsuite.pro"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD='qz^X5rp%KjH2SRlo'
ADMIN_EMAIL="admin@magicsuite.pro"
APP_DIR="/root/banking"

print_info "Domain: $DOMAIN"
print_info "App Directory: $APP_DIR"
echo ""
read -p "Press Enter to start deployment..."

# Step 1: Verify project exists
print_header "Step 1: Verifying Project Files"
if [ ! -d "$APP_DIR" ]; then
    print_error "Project directory not found: $APP_DIR"
    print_info "Please clone your project first:"
    print_info "  cd /root && git clone YOUR_REPO_URL banking"
    exit 1
fi

cd $APP_DIR

if [ ! -f "Dockerfile" ]; then
    print_error "Dockerfile not found in $APP_DIR"
    exit 1
fi

print_success "Project files verified"

# Step 2: Create Environment File
print_header "Step 2: Creating Environment Configuration"
cat > $APP_DIR/.env.production <<'EOF'
# Admin Credentials
ADMIN_EMAIL=admin@magicsuite.pro
ADMIN_PASSWORD=qz^X5rp%KjH2SRlo
ADMIN_USERNAME=admin

# URLs
CLIENT_URL=https://bankingsuite.magicsuite.pro
CORS_ORIGIN=https://bankingsuite.magicsuite.pro
SERVER_URL=https://bankingsuite.magicsuite.pro:3001
TEMPLATE_BASE_URL=https://bankingsuite.magicsuite.pro
BACKEND_URL=http://backend:3001

# Database
DB_PATH=/app/data/database.sqlite

# Security Keys
JWT_SECRET=554904df7d390d8d0ad2271b053ce66c53a05a11c7190dfbfae3c91fe08eb6c1f47e8f6aab29e459e4ee0549276dee63217416d66a39746899d9ec7c787a10c4
SESSION_SECRET=bd085aa9ce1900699150ff23e490614d3c98e4fd1213e304da544bd14d0a04d838012cc1bc4e742c30053fabd104efb9fc8b65b172d94835a97c3b2009f604c0
ENCRYPTION_KEY=428944a9164c2838be9d5f9c0a124537
ENCRYPTION_IV=4f37f6e7a72432ad

# Server Configuration
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
TRUST_PROXY=true

# Email
DEFAULT_FROM_EMAIL=no-reply@magicsuite.pro
DEFAULT_FROM_NAME=Multi-Banking Panel
EMAIL_FROM=no-reply@magicsuite.pro

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

# Step 3: Stop Conflicting Services
print_header "Step 3: Stopping Conflicting Services"

# Stop Dokploy if running
if docker ps | grep -q dokploy-traefik; then
    print_info "Stopping Dokploy Traefik..."
    docker stop dokploy-traefik 2>/dev/null || true
fi

DOKPLOY_CONTAINERS=$(docker ps -q --filter "name=dokploy" 2>/dev/null || true)
if [ -n "$DOKPLOY_CONTAINERS" ]; then
    print_info "Stopping Dokploy containers..."
    docker stop $DOKPLOY_CONTAINERS 2>/dev/null || true
fi

# Stop old banking-suite container
if docker ps -a | grep -q banking-suite; then
    print_info "Removing old banking-suite container..."
    docker stop banking-suite 2>/dev/null || true
    docker rm banking-suite 2>/dev/null || true
fi

print_success "Conflicting services stopped"

# Step 4: Build Docker Image
print_header "Step 4: Building Docker Image"
print_info "This will take 5-10 minutes..."
docker build -t banking-suite:latest $APP_DIR
print_success "Docker image built successfully"

# Step 5: Start Application
print_header "Step 5: Starting Application Container"
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

# Step 6: Install Nginx & Certbot
print_header "Step 6: Installing Nginx & Certbot"
apt update -y
apt install -y nginx certbot python3-certbot-nginx
print_success "Nginx and Certbot installed"

# Step 7: Configure Nginx
print_header "Step 7: Configuring Nginx"

# Stop Apache if running
systemctl stop apache2 2>/dev/null || true
systemctl disable apache2 2>/dev/null || true

cat > /etc/nginx/sites-available/banking-suite <<'EOF'
server {
    listen 80;
    server_name bankingsuite.magicsuite.pro;

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

ln -sf /etc/nginx/sites-available/banking-suite /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl restart nginx
print_success "Nginx configured and started"

# Step 8: Configure Firewall
print_header "Step 8: Configuring Firewall"
ufw allow 22/tcp 2>/dev/null
ufw allow 80/tcp 2>/dev/null
ufw allow 443/tcp 2>/dev/null
print_success "Firewall rules configured"

# Step 9: Setup SSL
print_header "Step 9: Setting Up SSL Certificate"
print_info "Obtaining Let's Encrypt SSL certificate..."

certbot --nginx \
    -d $DOMAIN \
    --email $ADMIN_EMAIL \
    --agree-tos \
    --non-interactive \
    --redirect

if [ $? -eq 0 ]; then
    print_success "SSL certificate installed successfully"
    systemctl enable certbot.timer
    systemctl start certbot.timer
    print_success "SSL auto-renewal configured"
else
    print_warning "SSL setup failed"
    print_info "You can run manually: certbot --nginx -d $DOMAIN"
fi

# Get Server IP
SERVER_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "Unknown")

# Final Summary
print_header "✅ Deployment Complete!"
echo ""
print_success "Banking Suite is live!"
echo ""
print_info "Access Information:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🌐 Admin Panel: ${GREEN}https://$DOMAIN/admin${NC}"
echo "  👤 Username:    ${GREEN}$ADMIN_USERNAME${NC}"
echo "  🔑 Password:    ${GREEN}$ADMIN_PASSWORD${NC}"
echo "  📡 Server IP:   ${GREEN}$SERVER_IP${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_warning "Important Notes:"
echo "  • Main page shows 403 error (anti-bot protection - this is normal)"
echo "  • Save your credentials securely"
echo "  • Add spam domains in the admin panel"
echo ""
print_info "Useful Commands:"
echo "  • View logs:     docker logs -f banking-suite"
echo "  • Restart app:   docker restart banking-suite"
echo "  • Stop app:      docker stop banking-suite"
echo "  • Container IP:  docker inspect banking-suite | grep IPAddress"
echo "  • Nginx logs:    tail -f /var/log/nginx/error.log"
echo ""
print_info "Update Application:"
echo "  cd $APP_DIR"
echo "  git pull"
echo "  docker build -t banking-suite:latest ."
echo "  docker stop banking-suite && docker rm banking-suite"
echo "  # Then re-run this script"
echo ""
print_header "Deployment Completed Successfully!"
echo ""
