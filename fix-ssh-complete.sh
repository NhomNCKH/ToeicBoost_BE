#!/bin/bash

# Complete SSH Setup Script for GitHub Actions Deployment
# This script will create all necessary SSH keys and provide setup instructions

set -e

echo "🔧 Complete SSH Setup for GitHub Actions Deployment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_HOST="144.91.104.237"
SERVER_USER="root"
GITHUB_REPO="NhomNCKH/ToeicBoost_BE"

echo -e "${BLUE}Step 1: Creating SSH key for GitHub Actions → Server${NC}"
echo "This key will be used by GitHub Actions to connect to your server"

# Create SSH key for GitHub Actions to connect to server
if [ -f ~/.ssh/toeicai_actions ]; then
    echo -e "${YELLOW}Removing existing toeicai_actions key...${NC}"
    rm -f ~/.ssh/toeicai_actions ~/.ssh/toeicai_actions.pub
fi

ssh-keygen -t rsa -b 4096 -f ~/.ssh/toeicai_actions -N "" -C "actions-$(date +%s)"
echo -e "${GREEN}✅ Created ~/.ssh/toeicai_actions${NC}"

echo -e "\n${BLUE}Step 2: Creating SSH key for Server → GitHub${NC}"
echo "This key will be used by your server to pull code from GitHub"

# Create SSH key for server to connect to GitHub
if [ -f ~/.ssh/github_deploy ]; then
    echo -e "${YELLOW}Removing existing github_deploy key...${NC}"
    rm -f ~/.ssh/github_deploy ~/.ssh/github_deploy.pub
fi

ssh-keygen -t rsa -b 4096 -f ~/.ssh/github_deploy -N "" -C "server-github-$(date +%s)"
echo -e "${GREEN}✅ Created ~/.ssh/github_deploy${NC}"

echo -e "\n${BLUE}Step 3: Testing local SSH connection to server${NC}"
echo "Testing if we can connect to the server..."

# Test SSH connection (this will fail initially, but that's expected)
if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i ~/.ssh/toeicai_actions ${SERVER_USER}@${SERVER_HOST} "echo 'Connection test'" 2>/dev/null; then
    echo -e "${GREEN}✅ SSH connection to server works!${NC}"
else
    echo -e "${YELLOW}⚠️  SSH connection failed (expected - need to add public key to server)${NC}"
fi

echo -e "\n${GREEN}🎯 SETUP INSTRUCTIONS${NC}"
echo "===================="

echo -e "\n${YELLOW}STEP A: Add GitHub Actions SSH key to your server${NC}"
echo "1. Copy this public key:"
echo -e "${BLUE}"
cat ~/.ssh/toeicai_actions.pub
echo -e "${NC}"
echo ""
echo "2. SSH to your server and add it to authorized_keys:"
echo "   ssh root@${SERVER_HOST}"
echo "   echo \"$(cat ~/.ssh/toeicai_actions.pub)\" >> ~/.ssh/authorized_keys"
echo "   chmod 600 ~/.ssh/authorized_keys"
echo "   exit"

echo -e "\n${YELLOW}STEP B: Add Server SSH key to GitHub as Deploy Key${NC}"
echo "1. Copy this public key:"
echo -e "${BLUE}"
cat ~/.ssh/github_deploy.pub
echo -e "${NC}"
echo ""
echo "2. Go to: https://github.com/${GITHUB_REPO}/settings/keys"
echo "3. Click 'Add deploy key'"
echo "4. Title: 'Server Deploy Key'"
echo "5. Paste the public key above"
echo "6. Check 'Allow write access' (if you need to push from server)"
echo "7. Click 'Add key'"

echo -e "\n${YELLOW}STEP C: Add SSH private key to GitHub Secrets${NC}"
echo "1. Copy this ENTIRE private key (including BEGIN/END lines):"
echo -e "${BLUE}"
cat ~/.ssh/toeicai_actions
echo -e "${NC}"
echo ""
echo "2. Go to: https://github.com/${GITHUB_REPO}/settings/secrets/actions"
echo "3. Add these secrets:"
echo "   - SERVER_HOST: ${SERVER_HOST}"
echo "   - SERVER_USER: ${SERVER_USER}"
echo "   - SERVER_SSH_KEY: (paste the private key above)"

echo -e "\n${YELLOW}STEP D: Copy GitHub deploy key to server${NC}"
echo "1. Copy this private key:"
echo -e "${BLUE}"
cat ~/.ssh/github_deploy
echo -e "${NC}"
echo ""
echo "2. SSH to your server and create the key file:"
echo "   ssh root@${SERVER_HOST}"
echo "   cat > ~/.ssh/github_deploy << 'EOF'"
cat ~/.ssh/github_deploy
echo "EOF"
echo "   chmod 600 ~/.ssh/github_deploy"
echo ""
echo "3. Create SSH config on server:"
echo "   cat > ~/.ssh/config << 'EOF'"
echo "Host github.com"
echo "    HostName github.com"
echo "    User git"
echo "    IdentityFile ~/.ssh/github_deploy"
echo "    StrictHostKeyChecking no"
echo "EOF"
echo "   chmod 600 ~/.ssh/config"
echo ""
echo "4. Test GitHub connection from server:"
echo "   ssh -T git@github.com"
echo "   (Should show: Hi ${GITHUB_REPO}! You've successfully authenticated...)"

echo -e "\n${GREEN}🧪 VERIFICATION STEPS${NC}"
echo "==================="
echo ""
echo "After completing all steps above, run these tests:"
echo ""
echo "1. Test GitHub Actions → Server connection:"
echo "   ssh -i ~/.ssh/toeicai_actions ${SERVER_USER}@${SERVER_HOST} \"echo 'GitHub Actions can connect!'\""
echo ""
echo "2. Test Server → GitHub connection (run on server):"
echo "   ssh -T git@github.com"
echo ""
echo "3. Test git operations on server:"
echo "   cd /var/www/toeicai/ToeicBoost_BE"
echo "   git remote set-url origin git@github.com:${GITHUB_REPO}.git"
echo "   git fetch origin main"

echo -e "\n${GREEN}📋 SUMMARY${NC}"
echo "=========="
echo "Created SSH keys:"
echo "- ~/.ssh/toeicai_actions (GitHub Actions → Server)"
echo "- ~/.ssh/github_deploy (Server → GitHub)"
echo ""
echo "Next: Follow steps A, B, C, D above to complete the setup!"

echo -e "\n${BLUE}💡 TIP: Save this output! You'll need the keys shown above.${NC}"