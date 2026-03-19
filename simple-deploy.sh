#!/bin/bash

echo "🚀 SIMPLE DEPLOYMENT"
echo "==================="

# Check if we're in the right directory
if [ ! -f package.json ]; then
    echo "❌ Please run this script from the project directory"
    echo "   cd /var/www/toeicai/ToeicBoost_BE"
    echo "   ./simple-deploy.sh"
    exit 1
fi

echo "📁 Working in: $(pwd)"

# Step 1: Stop existing processes
echo ""
echo "🛑 Stopping existing processes..."
pkill -f "node.*dist/main.js" || true
pkill -f "npm.*start:prod" || true
sleep 3

# Step 2: Update code
echo ""
echo "📥 Updating code..."
git pull origin main

# Step 3: Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Step 4: Build
echo ""
echo "🏗️ Building..."
npm run build

# Check if build was successful
if [ ! -f dist/main.js ]; then
    echo "❌ Build failed - dist/main.js not found"
    exit 1
fi

echo "✅ Build successful"

# Step 5: Start application
echo ""
echo "🚀 Starting application..."
NODE_ENV=development npm run start:prod > app.log 2>&1 &
APP_PID=$!

echo "Started with PID: $APP_PID"

# Wait a bit
sleep 10

# Check if it's running
if ps -p $APP_PID > /dev/null 2>&1; then
    echo "✅ Application is running"
    
    # Test health endpoint
    echo "🧪 Testing health endpoint..."
    if curl -s http://localhost:3001/ > /dev/null; then
        echo "✅ Health endpoint working"
        echo ""
        echo "🎉 DEPLOYMENT SUCCESSFUL!"
        echo "🌐 Health: http://144.91.104.237:3001/"
        echo "📚 Swagger: http://144.91.104.237:3001/api/v1/docs"
    else
        echo "❌ Health endpoint not responding"
        echo "Check logs: tail -f app.log"
    fi
else
    echo "❌ Application failed to start"
    echo "Check logs: tail -f app.log"
    exit 1
fi