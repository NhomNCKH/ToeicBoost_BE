#!/bin/bash

# Debug script to check server status and logs
echo "🔍 DEBUGGING SERVER STATUS..."
echo "================================"

# Check if we're in the right directory
echo "📁 Current directory:"
pwd

# Check git status
echo ""
echo "📋 Git status:"
git status --porcelain
git log --oneline -5

# Check Node.js processes
echo ""
echo "🔍 Node.js processes:"
ps aux | grep -E "(node|npm)" | grep -v grep || echo "No Node.js processes found"

# Check port 3001 usage
echo ""
echo "🔍 Port 3001 status:"
netstat -tuln | grep 3001 || echo "Port 3001 not in use"
lsof -i :3001 || echo "No processes using port 3001"

# Check application logs
echo ""
echo "📋 Application logs (last 50 lines):"
if [ -f app.log ]; then
    echo "--- app.log ---"
    tail -50 app.log
else
    echo "app.log not found"
fi

# Check npm logs
echo ""
echo "📋 NPM logs:"
if [ -f npm-debug.log ]; then
    echo "--- npm-debug.log ---"
    tail -20 npm-debug.log
else
    echo "npm-debug.log not found"
fi

# Check system resources
echo ""
echo "💾 System resources:"
echo "Memory:"
free -h
echo "Disk:"
df -h /var/www/toeicai/ToeicBoost_BE

# Check environment variables
echo ""
echo "🌍 Environment variables:"
echo "NODE_ENV: $NODE_ENV"
echo "APP_PORT: $APP_PORT"
echo "API_PREFIX: $API_PREFIX"

# Check .env file
echo ""
echo "📄 .env file status:"
if [ -f .env ]; then
    echo ".env file exists"
    echo "First 10 lines (excluding sensitive data):"
    head -10 .env | grep -v -E "(PASSWORD|SECRET|KEY)" || echo "No safe lines to show"
else
    echo ".env file not found"
fi

# Check if dist directory exists and has content
echo ""
echo "📦 Build output:"
if [ -d dist ]; then
    echo "dist directory exists"
    echo "Contents:"
    ls -la dist/
    if [ -f dist/main.js ]; then
        echo "main.js exists in dist"
        echo "Size: $(ls -lh dist/main.js | awk '{print $5}')"
    else
        echo "main.js NOT found in dist"
    fi
else
    echo "dist directory NOT found"
fi

# Try to start the application manually for testing
echo ""
echo "🧪 Testing manual start..."
echo "Attempting to start application..."

# Kill any existing processes first
pkill -f "node.*dist/main.js" || true
sleep 2

# Try to start and capture output
timeout 30s npm run start:prod &
START_PID=$!
sleep 10

# Check if it started
if ps -p $START_PID > /dev/null; then
    echo "✅ Application started successfully (PID: $START_PID)"
    
    # Test endpoints
    echo "🧪 Testing endpoints..."
    
    echo "Testing /"
    curl -s -m 5 http://localhost:3001/ || echo "Failed to connect to /"
    
    echo "Testing /health"
    curl -s -m 5 http://localhost:3001/health || echo "Failed to connect to /health"
    
    echo "Testing /api/v1/docs"
    curl -s -m 5 http://localhost:3001/api/v1/docs || echo "Failed to connect to /api/v1/docs"
    
    # Kill the test process
    kill $START_PID 2>/dev/null || true
else
    echo "❌ Application failed to start"
    echo "Checking logs..."
    tail -20 app.log 2>/dev/null || echo "No app.log found"
fi

echo ""
echo "🔍 Debug completed!"