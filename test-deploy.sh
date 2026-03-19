#!/bin/bash

echo "🧪 Testing deployment locally..."

# Test build
echo "📦 Testing build..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# Test lint
echo "🔍 Testing lint..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Lint failed"
    exit 1
fi

# Test unit tests
echo "🧪 Running tests..."
npm test
if [ $? -ne 0 ]; then
    echo "❌ Tests failed"
    exit 1
fi

echo "✅ All local tests passed! Ready to deploy."

# Test SSH connection to server
echo "🔐 Testing SSH connection..."
ssh -o ConnectTimeout=10 root@144.91.104.237 "echo 'SSH connection successful'"
if [ $? -ne 0 ]; then
    echo "❌ SSH connection failed"
    exit 1
fi

echo "🚀 Ready to push and auto-deploy!"