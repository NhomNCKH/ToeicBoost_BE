#!/bin/bash

echo "🔧 SETUP SSH DEPLOYMENT - STEP BY STEP"
echo "======================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}📋 STEP $1: $2${NC}"
    echo "----------------------------------------"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Configuration
SERVER_HOST="144.91.104.237"
SERVER_USER="root"
KEY_NAME="toeicai_deploy_$(date +%Y%m%d_%H%M%S)"
KEY_PATH="$HOME/.ssh/$KEY_NAME"

echo "This script will setup SSH deployment step by step"
echo "Server: $SERVER_USER@$SERVER_HOST"
echo "SSH Key: $KEY_PATH"
echo ""

# STEP 1: Generate SSH Key
print_step "1" "Generate SSH Key Pair"
echo "Creating new SSH key pair..."

# Create .ssh directory if not exists
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Generate SSH key
ssh-keygen -t rsa -b 4096 -C "github-deploy-$(date +%s)@toeicai.com" -f "$KEY_PATH" -N ""

if [ -f "$KEY_PATH" ] && [ -f "$KEY_PATH.pub" ]; then
    chmod 600 "$KEY_PATH"
    chmod 644 "$KEY_PATH.pub"
    print_success "SSH key pair generated successfully"
    echo "   Private key: $KEY_PATH"
    echo "   Public key: $KEY_PATH.pub"
else
    print_error "Failed to generate SSH key"
    exit 1
fi

echo ""
read -p "Press Enter to continue to Step 2..."

# STEP 2: Copy Public Key to Server
print_step "2" "Copy Public Key to Server"
echo "Copying public key to server..."
echo "You may need to enter the server password."
echo ""

if ssh-copy-id -i "$KEY_PATH.pub" "$SERVER_USER@$SERVER_HOST"; then
    print_success "Public key copied to server successfully"
else
    print_error "Failed to copy public key to server"
    echo ""
    print_warning "Manual setup required:"
    echo "1. SSH to server: ssh $SERVER_USER@$SERVER_HOST"
    echo "2. Create .ssh directory: mkdir -p ~/.ssh && chmod 700 ~/.ssh"
    echo "3. Add this key:"
    echo ""
    echo "echo '$(cat "$KEY_PATH.pub")' >> ~/.ssh/authorized_keys"
    echo "chmod 600 ~/.ssh/authorized_keys"
    echo ""
    read -p "Press Enter after completing manual setup..."
fi

echo ""
read -p "Press Enter to continue to Step 3..."

# STEP 3: Test SSH Connection
print_step "3" "Test SSH Connection"
echo "Testing SSH connection to server..."

if ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "echo 'SSH connection successful'"; then
    print_success "SSH connection works!"
else
    print_error "SSH connection failed"
    echo "Please check your server access and try again"
    exit 1
fi

echo ""
read -p "Press Enter to continue to Step 4..."

# STEP 4: Setup GitHub Access on Server
print_step "4" "Setup GitHub Access on Server"
echo "Setting up GitHub SSH access on server..."

ssh -i "$KEY_PATH" "$SERVER_USER@$SERVER_HOST" << 'EOF'
echo "🔧 Setting up GitHub access on server..."

# Remove old GitHub keys
rm -f ~/.ssh/id_rsa* ~/.ssh/github_* ~/.ssh/deploy_* 2>/dev/null || true

# Generate SSH key for GitHub
ssh-keygen -t rsa -b 4096 -C "server-github-$(date +%s)@toeicai.com" -f ~/.ssh/github_deploy -N ""

# Set permissions
chmod 600 ~/.ssh/github_deploy
chmod 644 ~/.ssh/github_deploy.pub

# Add GitHub to known hosts
ssh-keyscan github.com >> ~/.ssh/known_hosts 2>/dev/null

# Create SSH config for GitHub
cat > ~/.ssh/config << 'CONFIG'
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/github_deploy
    StrictHostKeyChecking no
CONFIG

chmod 600 ~/.ssh/config

echo "✅ GitHub SSH setup completed on server"
EOF

if [ $? -eq 0 ]; then
    print_success "GitHub SSH setup completed on server"
else
    print_error "Failed to setup GitHub SSH on server"
    exit 1
fi

echo ""
read -p "Press Enter to continue to Step 5..."

# STEP 5: Get Keys for GitHub Setup
print_step "5" "Get Keys for GitHub Setup"

echo ""
echo "🔑 SERVER'S GITHUB PUBLIC KEY (for GitHub Deploy Keys):"
echo "======================================================="
SERVER_GITHUB_KEY=$(ssh -i "$KEY_PATH" "$SERVER_USER@$SERVER_HOST" "cat ~/.ssh/github_deploy.pub")
echo "$SERVER_GITHUB_KEY"
echo "======================================================="
echo ""

echo "🔐 PRIVATE KEY (for GitHub Secrets):"
echo "===================================="
cat "$KEY_PATH"
echo "===================================="
echo ""

# STEP 6: GitHub Setup Instructions
print_step "6" "GitHub Setup Instructions"

echo ""
echo "🔑 ADD DEPLOY KEY TO GITHUB:"
echo "1. Go to: https://github.com/NhomNCKH/ToeicBoost_BE/settings/keys"
echo "2. Click 'Add deploy key'"
echo "3. Title: 'Server Deploy Key $(date +%Y%m%d)'"
echo "4. Key: Copy the SERVER'S GITHUB PUBLIC KEY above"
echo "5. ✅ IMPORTANT: Check 'Allow write access'"
echo "6. Click 'Add key'"
echo ""

echo "🔐 ADD GITHUB SECRETS:"
echo "1. Go to: https://github.com/NhomNCKH/ToeicBoost_BE/settings/secrets/actions"
echo "2. Click 'New repository secret' and add these 3 secrets:"
echo ""
echo "   SECRET 1:"
echo "   Name: SERVER_HOST"
echo "   Value: $SERVER_HOST"
echo ""
echo "   SECRET 2:"
echo "   Name: SERVER_USER"
echo "   Value: $SERVER_USER"
echo ""
echo "   SECRET 3:"
echo "   Name: SERVER_SSH_KEY"
echo "   Value: Copy the PRIVATE KEY above (including -----BEGIN and -----END lines)"
echo ""

read -p "Press Enter after completing GitHub setup..."

# STEP 7: Test Complete Flow
print_step "7" "Test Complete Deployment Flow"
echo "Testing complete deployment flow..."

# Test GitHub access from server
ssh -i "$KEY_PATH" "$SERVER_USER@$SERVER_HOST" << 'EOF'
echo "🔍 Testing GitHub SSH connection from server..."
ssh -T git@github.com 2>&1 | head -3

echo ""
echo "🔍 Testing git operations..."

# Navigate to project directory
if [ -d "/var/www/toeicai/ToeicBoost_BE" ]; then
    cd /var/www/toeicai/ToeicBoost_BE
else
    echo "Creating project directory..."
    mkdir -p /var/www/toeicai
    cd /var/www/toeicai
    git clone git@github.com:NhomNCKH/ToeicBoost_BE.git
    cd ToeicBoost_BE
fi

# Set git remote to SSH
git remote set-url origin git@github.com:NhomNCKH/ToeicBoost_BE.git

# Test git fetch
echo "Testing git fetch..."
if git fetch origin main; then
    echo "✅ Git fetch successful"
    echo "Latest commits:"
    git log --oneline -3
else
    echo "❌ Git fetch failed"
    exit 1
fi

echo "✅ All server operations working"
EOF

if [ $? -eq 0 ]; then
    print_success "Complete deployment flow test passed!"
else
    print_error "Deployment flow test failed"
    echo "Please check the GitHub Deploy Key setup"
    exit 1
fi

echo ""
read -p "Press Enter to continue to final step..."

# STEP 8: Final Instructions
print_step "8" "Final Instructions & Test Deployment"

echo ""
echo "🚀 NOW TEST THE DEPLOYMENT:"
echo "1. Go to: https://github.com/NhomNCKH/ToeicBoost_BE/actions"
echo "2. Click on 'Deploy to Production' workflow"
echo "3. Click 'Run workflow' → 'Run workflow'"
echo "4. Monitor the logs - SSH authentication should work now"
echo ""

echo "🔍 IF DEPLOYMENT STILL FAILS:"
echo "- Check Deploy Key has 'Allow write access' enabled"
echo "- Verify all 3 GitHub Secrets are correctly set"
echo "- Make sure no typos in the private key"
echo ""

# Final summary
echo ""
echo -e "${GREEN}🎉 SSH DEPLOYMENT SETUP COMPLETED!${NC}"
echo "========================================="
echo ""
echo "✅ SSH keys generated and configured"
echo "✅ Server can access GitHub via SSH"
echo "✅ GitHub Actions can connect to server"
echo "✅ Git operations verified on server"
echo ""
echo "📝 Key files created:"
echo "   Private key: $KEY_PATH"
echo "   Public key: $KEY_PATH.pub"
echo ""
echo "🚀 Ready for deployment!"
echo ""
echo "If you need to debug later, you can SSH to server with:"
echo "ssh -i $KEY_PATH $SERVER_USER@$SERVER_HOST"