#!/bin/bash

###############################################################################
# Banking Suite - VPS Setup Script for Ubuntu 22.04
# 
# This script automates the initial VPS setup and Dokploy installation
#
# Usage:
#   1. SSH into your Ubuntu 22.04 VPS
#   2. wget https://raw.githubusercontent.com/YOUR_USERNAME/banking-suite/main/vps-setup.sh
#   3. chmod +x vps-setup.sh
#   4. ./vps-setup.sh
#
# Or run directly:
#   curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/banking-suite/main/vps-setup.sh | bash
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Welcome message
clear
print_header "Banking Suite - VPS Setup Script"
print_info "This script will configure your Ubuntu 22.04 VPS and install Dokploy"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Step 1: System Update
print_header "Step 1: Updating System Packages"
print_info "Updating package lists..."
apt update -y

print_info "Upgrading installed packages..."
DEBIAN_FRONTEND=noninteractive apt upgrade -y

print_success "System packages updated"

# Step 2: Install Essential Tools
print_header "Step 2: Installing Essential Tools"
print_info "Installing curl, wget, git, unzip, htop, nano..."
apt install -y curl wget git unzip htop nano ufw

print_success "Essential tools installed"

# Step 3: Configure Timezone
print_header "Step 3: Timezone Configuration"
echo "Current timezone: $(timedatectl | grep "Time zone" | awk '{print $3}')"
echo ""
echo "Common timezones:"
echo "  1) Europe/Berlin"
echo "  2) Europe/London"
echo "  3) America/New_York"
echo "  4) America/Los_Angeles"
echo "  5) Asia/Tokyo"
echo "  6) Skip (keep current)"
echo ""
read -p "Select timezone (1-6): " tz_choice

case $tz_choice in
    1) TIMEZONE="Europe/Berlin" ;;
    2) TIMEZONE="Europe/London" ;;
    3) TIMEZONE="America/New_York" ;;
    4) TIMEZONE="America/Los_Angeles" ;;
    5) TIMEZONE="Asia/Tokyo" ;;
    6) TIMEZONE="" ;;
    *) print_warning "Invalid choice, keeping current timezone"
       TIMEZONE="" ;;
esac

if [ -n "$TIMEZONE" ]; then
    timedatectl set-timezone "$TIMEZONE"
    print_success "Timezone set to: $TIMEZONE"
else
    print_info "Timezone unchanged"
fi

# Step 4: Configure Firewall
print_header "Step 4: Configuring Firewall (UFW)"
print_info "Setting up firewall rules..."

# Reset UFW to default
ufw --force reset

# Set default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (IMPORTANT: Don't lock yourself out!)
ufw allow 22/tcp comment 'SSH'
print_success "Allowed: SSH (port 22)"

# Allow HTTP
ufw allow 80/tcp comment 'HTTP'
print_success "Allowed: HTTP (port 80)"

# Allow HTTPS
ufw allow 443/tcp comment 'HTTPS'
print_success "Allowed: HTTPS (port 443)"

# Allow Dokploy Dashboard
ufw allow 3000/tcp comment 'Dokploy Dashboard'
print_success "Allowed: Dokploy Dashboard (port 3000)"

# Enable firewall
print_info "Enabling firewall..."
ufw --force enable

print_success "Firewall configured and enabled"
echo ""
ufw status

# Step 5: Check and Remove Existing Web Servers
print_header "Step 5: Checking for Port Conflicts"
print_info "Checking if ports 80 and 443 are available..."

# Check what's using port 80
PORT_80_PROCESS=$(lsof -ti:80 2>/dev/null || true)
PORT_443_PROCESS=$(lsof -ti:443 2>/dev/null || true)

if [ -n "$PORT_80_PROCESS" ] || [ -n "$PORT_443_PROCESS" ]; then
    print_warning "Ports 80 or 443 are in use. This will conflict with Dokploy."
    
    # Check for Apache
    if systemctl is-active --quiet apache2 2>/dev/null; then
        print_info "Stopping and removing Apache..."
        systemctl stop apache2
        systemctl disable apache2
        apt remove apache2 -y
        apt autoremove -y
        print_success "Apache removed"
    fi
    
    # Check for Nginx
    if systemctl is-active --quiet nginx 2>/dev/null; then
        print_info "Stopping and removing Nginx..."
        systemctl stop nginx
        systemctl disable nginx
        apt remove nginx nginx-common -y
        apt autoremove -y
        print_success "Nginx removed"
    fi
    
    # Kill any remaining processes on ports 80 and 443
    if [ -n "$PORT_80_PROCESS" ]; then
        print_info "Killing process on port 80..."
        kill -9 $PORT_80_PROCESS 2>/dev/null || true
    fi
    
    if [ -n "$PORT_443_PROCESS" ]; then
        print_info "Killing process on port 443..."
        kill -9 $PORT_443_PROCESS 2>/dev/null || true
    fi
    
    sleep 2
    print_success "Ports 80 and 443 are now available"
else
    print_success "Ports 80 and 443 are available"
fi

# Step 6: Install Dokploy
print_header "Step 6: Installing Dokploy"
print_warning "This will install Docker and Dokploy (takes 3-5 minutes)"
read -p "Press Enter to continue..."

print_info "Running Dokploy installation script..."
curl -sSL https://dokploy.com/install.sh | sh

print_success "Dokploy installation completed!"

# Step 7: Verify Installation
print_header "Step 7: Verifying Installation"
print_info "Checking Docker installation..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker installed: $DOCKER_VERSION"
else
    print_error "Docker not found. Installation may have failed."
    exit 1
fi

print_info "Checking Dokploy containers..."
sleep 5  # Wait for containers to start
RUNNING_CONTAINERS=$(docker ps --format "{{.Names}}" | grep -c dokploy || true)
if [ "$RUNNING_CONTAINERS" -gt 0 ]; then
    print_success "Dokploy containers are running"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    print_warning "Dokploy containers not running yet. They may still be starting..."
fi

# Step 8: Get Server IP
print_header "Step 8: Server Information"
SERVER_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "Unable to detect")
print_info "Server IP Address: ${GREEN}$SERVER_IP${NC}"

# Step 9: Final Instructions
print_header "✅ Setup Complete!"
echo ""
print_success "Your VPS is now configured and Dokploy is installed"
echo ""
print_info "Next Steps:"
echo ""
echo "  1. Access Dokploy Dashboard:"
echo "     ${GREEN}http://$SERVER_IP:3000${NC}"
echo ""
echo "  2. Create your Dokploy admin account"
echo ""
echo "  3. Follow the deployment guide in DEPLOYMENT_GUIDE.md"
echo ""
print_warning "Security Reminders:"
echo "  • Save your Dokploy admin credentials securely"
echo "  • Consider setting up SSH key authentication"
echo "  • Keep your system updated: apt update && apt upgrade"
echo "  • Monitor your firewall: ufw status"
echo ""
print_info "Useful Commands:"
echo "  • Check Docker: docker ps"
echo "  • View logs: docker logs dokploy"
echo "  • Firewall status: ufw status"
echo "  • System info: htop"
echo ""
print_header "Setup Script Completed Successfully!"
echo ""
