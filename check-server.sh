#!/bin/bash

echo "🔍 CHECKING SERVER STATUS..."

# Check if we can SSH to server (this will be run locally to test SSH)
echo "Testing SSH connection..."
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@144.91.104.237 "echo 'SSH connection successful'"

if [ $? -eq 0 ]; then
    echo "✅ SSH connection working"
    
    # Run comprehensive checks on server
    ssh root@144.91.104.237 << 'EOF'
echo "📊 SERVER STATUS CHECK"
echo "====================="

echo "🐳 Docker Status:"
docker --version
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🔧 Docker Compose Status:"
cd /var/www/toeicai/ToeicBoost_BE 2>/dev/null || echo "❌ App directory not found"

if [ -d "/var/www/toeicai/ToeicBoost_BE" ]; then
    cd /var/www/toeicai/ToeicBoost_BE
    echo "Current directory: $(pwd)"
    
    if [ -f "docker-compose.production.yml" ]; then
        echo "✅ docker-compose.production.yml exists"
        docker-compose -f docker-compose.production.yml ps
    else
        echo "❌ docker-compose.production.yml not found"
    fi
    
    echo ""
    echo "📁 Files in app directory:"
    ls -la | head -10
fi

echo ""
echo "🌐 Network Status:"
echo "Checking port 3001..."
if netstat -tlnp | grep :3001; then
    echo "✅ Port 3001 is listening"
else
    echo "❌ Port 3001 not listening"
fi

echo ""
echo "🏥 Health Check:"
if curl -s --connect-timeout 5 http://localhost:3001/health; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
fi

echo ""
echo "🗄️ Database Connection Test:"
echo "Testing PostgreSQL connection..."
if pg_isready -h 144.91.104.237 -p 5433 -U toeicai_user; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL connection failed"
fi

echo ""
echo "📋 Container Logs (last 20 lines):"
if docker ps | grep -q toeic-api-prod; then
    docker logs --tail 20 toeic-api-prod
else
    echo "❌ toeic-api-prod container not found"
fi

EOF

else
    echo "❌ SSH connection failed"
    exit 1
fi