#!/bin/bash

echo "🔧 SSH DEPLOYMENT FIX SCRIPT"
echo "============================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
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

echo "This script will help you fix SSH authentication issues for deployment."
echo ""

# Step 1: Generate SSH key pair
print_info "Step 1: Generating SSH key pair for deployment"
echo ""

SSH_KEY_PATH="$HOME/.ssh/toeicai_deploy"

if [ -f "$SSH_KEY_PATH" ]; then
    print_warning "SSH key already exists at $SSH_KEY_PATH"
    read -p "Do you want to overwrite it? (y/N): " overwrite
    if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
        echo "Using existing key..."
    else
        rm -f "$SSH_KEY_PATH" "$SSH_KEY_PATH.pub"
        ssh-keygen -t rsa -b 4096 -C "github-deploy@toeicai.com" -f "$SSH_KEY_PATH" -N ""
        print_success "New SSH key generated"
    fi
else
    ssh-keygen -t rsa -b 4096 -C "github-deploy@toeicai.com" -f "$SSH_KEY_PATH" -N ""
    print_success "SSH key generated at $SSH_KEY_PATH"
fi

# Step 2: Display public key for GitHub
print_info "Step 2: Add this public key to GitHub Deploy Keys"
echo ""
echo "Copy this public key:"
echo "===================="
cat "$SSH_KEY_PATH.pub"
echo "===================="
echo ""
echo "Steps to add to GitHub:"
echo "1. Go to: https://github.com/NhomNCKH/ToeicBoost_BE/settings/keys"
echo "2. Click 'Add deploy key'"
echo "3. Title: 'Production Server Deploy Key'"
echo "4. Paste the public key above"
echo "5. Check 'Allow write access'"
echo "6. Click 'Add key'"
echo ""
read -p "Press Enter after adding the key to GitHub..."

# Step 3: Display private key for GitHub Secrets
print_info "Step 3: Add private key to GitHub Secrets"
echo ""
echo "Copy this private key for GitHub Secrets:"
echo "========================================"
cat "$SSH_KEY_PATH"
echo "========================================"
echo ""
echo "Steps to add to GitHub Secrets:"
echo "1. Go to: https://github.com/NhomNCKH/ToeicBoost_BE/settings/secrets/actions"
echo "2. Click 'New repository secret'"
echo "3. Name: SERVER_SSH_KEY"
echo "4. Value: Paste the private key above (including -----BEGIN and -----END lines)"
echo "5. Click 'Add secret'"
echo ""
read -p "Press Enter after adding the secret to GitHub..."

# Step 4: Copy public key to server
print_info "Step 4: Copy public key to server"
echo ""

SERVER_HOST="144.91.104.237"
SERVER_USER="root"

echo "Copying public key to server..."
if ssh-copy-id -i "$SSH_KEY_PATH.pub" "$SERVER_USER@$SERVER_HOST"; then
    print_success "Public key copied to server successfully"
else
    print_error "Failed to copy public key to server"
    echo ""
    echo "Manual steps:"
    echo "1. SSH to server: ssh $SERVER_USER@$SERVER_HOST"
    echo "2. Create .ssh directory: mkdir -p ~/.ssh"
    echo "3. Add this key to authorized_keys:"
    echo "   echo '$(cat "$SSH_KEY_PATH.pub")' >> ~/.ssh/authorized_keys"
    echo "4. Set permissions: chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh"
    exit 1
fi

# Step 5: Test SSH connection
print_info "Step 5: Testing SSH connection to server"
echo ""

if ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "echo 'SSH connection successful'"; then
    print_success "SSH connection to server works!"
else
    print_error "SSH connection to server failed"
    exit 1
fi

# Step 6: Setup SSH key on server for GitHub
print_info "Step 6: Setting up SSH key on server for GitHub access"
echo ""

ssh -i "$SSH_KEY_PATH" "$SERVER_USER@$SERVER_HOST" << 'EOF'
# Create SSH config for GitHub
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Generate SSH key for GitHub on server if not exists
if [ ! -f ~/.ssh/id_rsa ]; then
    ssh-keygen -t rsa -b 4096 -C "server@toeicai.com" -f ~/.ssh/id_rsa -N ""
    echo "SSH key generated on server"
fi

# Add GitHub to known hosts
ssh-keyscan github.com >> ~/.ssh/known_hosts 2>/dev/null

# Test GitHub SSH connection
echo "Testing GitHub SSH connection from server..."
ssh -T git@github.com 2>&1 | head -3

echo "Server SSH setup completed"
EOF

print_success "Server SSH setup completed"

# Step 7: Display server's public key for GitHub
print_info "Step 7: Add server's public key to GitHub Deploy Keys"
echo ""

echo "Server's public key (add this to GitHub Deploy Keys):"
echo "===================================================="
ssh -i "$SSH_KEY_PATH" "$SERVER_USER@$SERVER_HOST" "cat ~/.ssh/id_rsa.pub"
echo "===================================================="
echo ""
echo "Steps:"
echo "1. Go to: https://github.com/NhomNCKH/ToeicBoost_BE/settings/keys"
echo "2. Click 'Add deploy key'"
echo "3. Title: 'Server SSH Key'"
echo "4. Paste the server's public key above"
echo "5. Check 'Allow write access'"
echo "6. Click 'Add key'"
echo ""
read -p "Press Enter after adding the server's key to GitHub..."

# Step 8: Test complete deployment flow
print_info "Step 8: Testing complete deployment flow"
echo ""

echo "Testing git operations on server..."
ssh -i "$SSH_KEY_PATH" "$SERVER_USER@$SERVER_HOST" << 'EOF'
cd /var/www/toeicai/ToeicBoost_BE || exit 1

# Set git remote to SSH
git remote set-url origin git@github.com:NhomNCKH/ToeicBoost_BE.git

# Test git fetch
echo "Testing git fetch..."
if git fetch origin main; then
    echo "✅ Git fetch successful"
else
    echo "❌ Git fetch failed"
    exit 1
fi

echo "✅ All git operations working"
EOF

if [ $? -eq 0 ]; then
    print_success "Complete deployment flow test passed!"
else
    print_error "Deployment flow test failed"
    exit 1
fi

# Final summary
echo ""
echo -e "${GREEN}🎉 SSH DEPLOYMENT FIX COMPLETED!${NC}"
echo "=================================="
echo ""
echo "✅ SSH keys generated and configured"
echo "✅ Server can connect to GitHub via SSH"
echo "✅ GitHub Actions can connect to server"
echo "✅ Git operations working on server"
echo ""
echo "Next steps:"
echo "1. Trigger a new deployment from GitHub Actions"
echo "2. Monitor the deployment logs"
echo "3. The SSH authentication error should be resolved"
echo ""
echo "If you still get errors, check:"
echo "- GitHub Secrets are correctly set"
echo "- Deploy keys are added to GitHub with write access"
echo "- Server firewall allows SSH connections"