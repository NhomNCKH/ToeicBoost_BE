#!/bin/bash

echo "🚀 Manual deployment to production server..."

# SSH to server and deploy
ssh root@144.91.104.237 << 'EOF'
echo "🔧 Starting manual deployment..."

# Navigate to project directory
cd /var/www/toeicai/ToeicBoost_BE || exit 1

# Kill existing processes
sudo kill -9 $(sudo lsof -t -i:3001) 2>/dev/null || true
pkill -f "node.*dist/main.js" || true
pkill -f "npm.*start:prod" || true
sleep 5

echo "📊 Current git status:"
git status
git log --oneline -3

# Ensure SSH remote
git remote set-url origin git@github.com:NhomNCKH/ToeicBoost_BE.git

# Force pull latest code
git fetch origin main
git reset --hard origin/main
git clean -fd

echo "📊 After git pull:"
git log --oneline -3

# Check if AppController exists
if [ -f "src/app.controller.ts" ]; then
    echo "✅ AppController found"
else
    echo "❌ AppController missing - this is the problem!"
    exit 1
fi

# Install and build
npm install --production=false
npm run build

# Start application
NODE_ENV=development nohup npm run start:prod > app.log 2>&1 &

# Wait for startup
sleep 15

# Test endpoints
echo "🧪 Testing endpoints:"
curl -s http://localhost:3001/ || echo "Root endpoint failed"
curl -s http://localhost:3001/health || echo "Health endpoint failed"

# Final check
if curl -s http://localhost:3001/ | grep -q "TOEIC AI API is running"; then
    echo "✅ Deployment successful!"
else
    echo "❌ Deployment failed - checking logs:"
    tail -20 app.log
fi
EOF