#!/bin/bash

echo "🚀 Deploying via GitHub archive download..."

ssh root@144.91.104.237 << 'EOF'
echo "📦 Downloading latest code from GitHub..."

cd /var/www/toeicai/

# Kill existing processes
sudo kill -9 $(sudo lsof -t -i:3001) 2>/dev/null || true
pkill -f "node.*dist/main.js" || true
pkill -f "npm.*start:prod" || true
sleep 5

# Backup current directory
if [ -d "ToeicBoost_BE" ]; then
    mv ToeicBoost_BE ToeicBoost_BE_backup_$(date +%Y%m%d_%H%M%S)
fi

# Download latest code as zip
wget -O main.zip https://github.com/NhomNCKH/ToeicBoost_BE/archive/refs/heads/main.zip

# Extract
unzip -q main.zip
mv ToeicBoost_BE-main ToeicBoost_BE
rm main.zip

cd ToeicBoost_BE

# Copy environment file from backup if exists
cp ../ToeicBoost_BE_backup*/.env . 2>/dev/null || echo "No .env backup found"

# Check if we have the AppController
if [ -f "src/app.controller.ts" ]; then
    echo "✅ AppController found in downloaded code"
    head -5 src/app.controller.ts
else
    echo "❌ AppController still missing!"
    exit 1
fi

# Install dependencies
npm install --production=false

# Build
npm run build

# Start application
NODE_ENV=development nohup npm run start:prod > app.log 2>&1 &

# Wait for startup
sleep 15

# Test endpoints
echo "🧪 Testing endpoints:"
if curl -s http://localhost:3001/ | grep -q "TOEIC AI API is running"; then
    echo "✅ Deployment successful!"
    curl -s http://localhost:3001/ | head -3
else
    echo "❌ Deployment failed - checking logs:"
    tail -20 app.log
fi
EOF