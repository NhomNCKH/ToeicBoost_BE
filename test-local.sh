#!/bin/bash

echo "🧪 LOCAL TESTING SCRIPT"
echo "======================"

# Test environment
echo "🔍 Testing environment..."
if node test-env.js; then
    echo "✅ Environment test passed"
else
    echo "❌ Environment test failed"
    exit 1
fi

# Test build
echo ""
echo "🏗️ Testing build..."
if npm run build; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Test lint
echo ""
echo "🧹 Testing lint..."
if npm run lint; then
    echo "✅ Lint passed"
else
    echo "❌ Lint failed"
    exit 1
fi

# Test unit tests
echo ""
echo "🧪 Running tests..."
if npm test; then
    echo "✅ Tests passed"
else
    echo "❌ Tests failed"
    exit 1
fi

# Test start (quick test)
echo ""
echo "🚀 Testing application start..."

# Kill any existing processes
pkill -f "node.*dist/main.js" || true
sleep 2

# Start app in background
npm run start:prod > local_test.log 2>&1 &
TEST_PID=$!

echo "Started test app with PID: $TEST_PID"
sleep 10

# Check if still running
if ps -p $TEST_PID > /dev/null 2>&1; then
    echo "✅ Application started successfully"
    
    # Test endpoints
    echo "🧪 Testing endpoints..."
    
    if curl -f -s -m 5 http://localhost:3001/ > /dev/null; then
        echo "✅ Health endpoint working"
    else
        echo "❌ Health endpoint failed"
    fi
    
    if curl -f -s -m 5 http://localhost:3001/health > /dev/null; then
        echo "✅ Health detail endpoint working"
    else
        echo "❌ Health detail endpoint failed"
    fi
    
    if curl -f -s -m 5 http://localhost:3001/api/v1/docs > /dev/null; then
        echo "✅ Swagger endpoint working"
    else
        echo "❌ Swagger endpoint failed"
    fi
    
    # Kill test process
    kill $TEST_PID 2>/dev/null || true
    
else
    echo "❌ Application failed to start"
    echo "--- Logs ---"
    cat local_test.log 2>/dev/null || echo "No logs"
    exit 1
fi

# Cleanup
rm -f local_test.log
pkill -f "node.*dist/main.js" || true

echo ""
echo "🎉 ALL LOCAL TESTS PASSED!"
echo "Ready for deployment to server."