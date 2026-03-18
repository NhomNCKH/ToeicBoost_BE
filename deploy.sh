#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  TOEIC AI API - Deployment Script${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Configuration
SERVER_HOST="144.91.104.237"
SERVER_USER="root"
SERVER_PATH="/var/www/toeicai/ToeicBoost_BE"
BRANCH="main"

# Functions
deploy_to_server() {
    echo -e "${YELLOW}🚀 Starting deployment to production server...${NC}\n"
    
    # SSH and execute deployment commands
    ssh $SERVER_USER@$SERVER_HOST << EOF
        set -e
        
        echo "📁 Navigating to project directory..."
        cd $SERVER_PATH
        
        echo "🔄 Pulling latest code from $BRANCH branch..."
        git fetch origin
        git checkout $BRANCH
        git pull origin $BRANCH
        
        echo "📦 Installing dependencies..."
        npm ci --production=false
        
        echo "🏗️  Building project..."
        npm run build
        
        echo "🔄 Restarting application..."
        # Kill existing process
        pkill -f "node.*dist/main.js" || true
        sleep 2
        
        # Start new process in background
        nohup npm run start:prod > /dev/null 2>&1 &
        
        echo "✅ Deployment completed!"
        
        # Check if process is running
        sleep 3
        if pgrep -f "node.*dist/main.js" > /dev/null; then
            echo "✅ Application is running successfully"
            echo "🌐 API available at: http://$SERVER_HOST:3001"
            echo "📚 Swagger docs: http://$SERVER_HOST:3001/api_v1/docs"
        else
            echo "❌ Application failed to start"
            exit 1
        fi
EOF
    
    if [ $? -eq 0 ]; then
        echo -e "\n${GREEN}========================================${NC}"
        echo -e "${GREEN}✅ Deployment successful!${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo -e "🌐 API: http://$SERVER_HOST:3001"
        echo -e "📚 Docs: http://$SERVER_HOST:3001/api_v1/docs"
        echo -e "🏥 Health: http://$SERVER_HOST:3001/"
    else
        echo -e "\n${RED}========================================${NC}"
        echo -e "${RED}❌ Deployment failed!${NC}"
        echo -e "${RED}========================================${NC}"
        exit 1
    fi
}

check_server_status() {
    echo -e "${YELLOW}🔍 Checking server status...${NC}\n"
    
    ssh $SERVER_USER@$SERVER_HOST << 'EOF'
        cd /var/www/toeicai/ToeicBoost_BE
        
        echo "📋 Git Status:"
        git branch -v
        echo ""
        
        echo "🔄 Process Status:"
        if pgrep -f "node.*dist/main.js" > /dev/null; then
            echo "✅ Application is running"
            ps aux | grep "node.*dist/main.js" | grep -v grep
        else
            echo "❌ Application is not running"
        fi
        echo ""
        
        echo "🌐 Testing API endpoints:"
        curl -s http://localhost:3001/ | head -1 || echo "❌ Health check failed"
        curl -s http://localhost:3001/api_v1/auth/register -X POST -H "Content-Type: application/json" -d '{}' | head -1 || echo "❌ Auth API failed"
EOF
}

restart_server() {
    echo -e "${YELLOW}🔄 Restarting server...${NC}\n"
    
    ssh $SERVER_USER@$SERVER_HOST << 'EOF'
        cd /var/www/toeicai/ToeicBoost_BE
        
        echo "🛑 Stopping application..."
        pkill -f "node.*dist/main.js" || true
        sleep 2
        
        echo "🚀 Starting application..."
        nohup npm run start:prod > /dev/null 2>&1 &
        
        sleep 3
        if pgrep -f "node.*dist/main.js" > /dev/null; then
            echo "✅ Application restarted successfully"
        else
            echo "❌ Failed to restart application"
            exit 1
        fi
EOF
}

# Menu
echo -e "${YELLOW}Select deployment option:${NC}"
echo "1) Deploy latest code to production"
echo "2) Check server status"
echo "3) Restart server only"
echo "4) View server logs"
echo "5) Exit"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        deploy_to_server
        ;;
    2)
        check_server_status
        ;;
    3)
        restart_server
        ;;
    4)
        echo -e "${YELLOW}📋 Server logs (last 50 lines):${NC}\n"
        ssh $SERVER_USER@$SERVER_HOST "cd $SERVER_PATH && tail -50 nohup.out 2>/dev/null || echo 'No logs found'"
        ;;
    5)
        echo -e "${YELLOW}Exiting...${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice!${NC}"
        exit 1
        ;;
esac