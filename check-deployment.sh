#!/bin/bash

echo "🔍 Checking GitHub Actions deployment status..."

# Check latest workflow run
echo "📊 Latest GitHub Actions runs:"
echo "Visit: https://github.com/NhomNCKH/ToeicBoost_BE/actions"

echo ""
echo "🏥 Testing server health..."

# Test server endpoints
echo "Testing root endpoint:"
curl -s http://144.91.104.237:3001/ | jq . 2>/dev/null || curl -s http://144.91.104.237:3001/

echo ""
echo "Testing health endpoint:"
curl -s http://144.91.104.237:3001/health | jq . 2>/dev/null || curl -s http://144.91.104.237:3001/health

echo ""
echo "Testing Swagger docs:"
curl -s -I http://144.91.104.237:3001/api/v1/docs | head -1

echo ""
echo "🔗 Production URLs:"
echo "  API: http://144.91.104.237:3001/"
echo "  Health: http://144.91.104.237:3001/health"  
echo "  Swagger: http://144.91.104.237:3001/api/v1/docs"
echo "  Auth: http://144.91.104.237:3001/api/v1/auth/*"