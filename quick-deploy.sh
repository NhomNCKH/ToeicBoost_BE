#!/bin/bash

# Quick deployment script for server
# Run this directly on the server: bash quick-deploy.sh

echo "🚀 Quick Deploy Script"
echo "====================="

# Check if we're in the right directory
if [ ! -f package.json ]; then
    echo "❌ Please run this from the project directory: /var/www/toeicai/ToeicBoost_BE"
    exit 1
fi

# Kill existing processes
echo "🛑 Stopping existing app..."
pkill -f "node.*dist/main.js" || true
pkill -f "npm.*start:prod" || true
sleep 3

# Update code
echo "📥 Updating code..."
git fetch origin
git reset --hard origin/main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build
echo "🏗️ Building..."
npm run build

# Check build
if [ ! -f dist/main.js ]; then
    echo "❌ Build failed"
    exit 1
fi

# Setup environment
if [ ! -f .env ]; then
    echo "🌍 Creating .env..."
    cp .env.example .env
    sed -i 's/DB_HOST=localhost/DB_HOST=144.91.104.237/' .env
    sed -i 's/DB_PORT=5432/DB_PORT=5433/' .env
    sed -i 's/DB_USERNAME=postgres/DB_USERNAME=toeicai_user/' .env
    sed -i 's/DB_PASSWORD=postgres/DB_PASSWORD=StrongPassword123!/' .env
    sed -i 's/DB_DATABASE=toeic_ai/DB_DATABASE=toeicai/' .env
fi

# Start app
echo "🚀 Starting app..."
NODE_ENV=development nohup npm run start:prod > app.log 2>&1 &

# Wait
echo "⏳ Waiting..."
sleep 15

# Check
if curl -s http://localhost:3001/ | grep -q "ok"; then
    echo "✅ SUCCESS! App is running at http://144.91.104.237:3001/"
else
    echo "❌ Failed. Check logs: tail -f app.log"
    exit 1
fi