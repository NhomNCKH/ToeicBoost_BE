#!/bin/bash

echo "🔧 Fixing Git access on server..."

# Instructions for user
echo "📋 INSTRUCTIONS:"
echo "1. Go to GitHub.com → Settings → Developer settings → Personal access tokens"
echo "2. Generate new token (classic) with 'repo' scope"
echo "3. Copy the token"
echo "4. Run this command on server:"
echo ""
echo "ssh root@144.91.104.237"
echo "cd /var/www/toeicai/"
echo "rm -rf ToeicBoost_BE"
echo "git clone https://YOUR_TOKEN@github.com/NhomNCKH/ToeicBoost_BE.git"
echo "cd ToeicBoost_BE"
echo "cp ../ToeicBoost_BE_backup*/.env . 2>/dev/null || true"
echo "npm install"
echo "npm run build"
echo "NODE_ENV=development nohup npm run start:prod > app.log 2>&1 &"
echo ""
echo "🔗 GitHub Token URL: https://github.com/settings/tokens"

# Alternative: Use SSH with proper key
echo ""
echo "📋 ALTERNATIVE - Fix SSH Key:"
echo "1. Add server's SSH public key to GitHub Deploy Keys"
echo "2. Get server's public key:"
echo "   ssh root@144.91.104.237 'cat ~/.ssh/id_rsa.pub'"
echo "3. Add it to: https://github.com/NhomNCKH/ToeicBoost_BE/settings/keys"
echo "4. Then run: ssh root@144.91.104.237 'cd /var/www/toeicai/ToeicBoost_BE && git pull origin main'"