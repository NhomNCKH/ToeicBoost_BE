#!/bin/bash

echo "🔧 SETUP SERVER ENVIRONMENT"
echo "=========================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
    echo "----------------------------------------"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

SERVER_HOST="144.91.104.237"
SERVER_USER="root"
KEY_PATH="$HOME/.ssh/toeicai_actions"

if [ ! -f "$KEY_PATH" ]; then
    print_error "SSH key not found: $KEY_PATH"
    echo "Please run fix-ssh-complete.sh first"
    exit 1
fi

print_step "Checking and setting up server environment..."

ssh -i "$KEY_PATH" "$SERVER_USER@$SERVER_HOST" << 'EOF'
set -e

echo "🔍 CHECKING SERVER ENVIRONMENT"
echo "=============================="

# Check Node.js
echo "📋 Checking Node.js..."
if command -v node >/dev/null 2>&1; then
    echo "✅ Node.js version: $(node --version)"
else
    echo "❌ Node.js not installed"
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "✅ Node.js installed: $(node --version)"
fi

# Check npm
echo "📋 Checking npm..."
if command -v npm >/dev/null 2>&1; then
    echo "✅ npm version: $(npm --version)"
else
    echo "❌ npm not found"
fi

# Check PostgreSQL
echo "📋 Checking PostgreSQL..."
if command -v psql >/dev/null 2>&1; then
    echo "✅ PostgreSQL installed"
    sudo systemctl status postgresql --no-pager || echo "PostgreSQL service status unknown"
else
    echo "❌ PostgreSQL not installed"
    echo "Installing PostgreSQL..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    echo "✅ PostgreSQL installed"
fi

# Check Redis
echo "📋 Checking Redis..."
if command -v redis-server >/dev/null 2>&1; then
    echo "✅ Redis installed"
    sudo systemctl status redis --no-pager || echo "Redis service status unknown"
else
    echo "❌ Redis not installed"
    echo "Installing Redis..."
    sudo apt update
    sudo apt install -y redis-server
    sudo systemctl start redis
    sudo systemctl enable redis
    echo "✅ Redis installed"
fi

# Check Git
echo "📋 Checking Git..."
if command -v git >/dev/null 2>&1; then
    echo "✅ Git version: $(git --version)"
else
    echo "❌ Git not installed"
    sudo apt update
    sudo apt install -y git
    echo "✅ Git installed"
fi

# Create project directory
echo "📋 Setting up project directory..."
sudo mkdir -p /var/www/toeicai
sudo chown -R $USER:$USER /var/www/toeicai
echo "✅ Project directory created: /var/www/toeicai"

# Check if project exists
if [ -d "/var/www/toeicai/ToeicBoost_BE" ]; then
    echo "✅ Project directory exists"
    cd /var/www/toeicai/ToeicBoost_BE
    echo "Current git status:"
    git status --porcelain || echo "Git status check failed"
else
    echo "📥 Cloning project..."
    cd /var/www/toeicai
    if [ -f ~/.ssh/github_deploy ]; then
        echo "Using GitHub deploy key..."
        git clone git@github.com:NhomNCKH/ToeicBoost_BE.git
        echo "✅ Project cloned successfully"
    else
        echo "❌ GitHub deploy key not found"
        echo "Please setup GitHub SSH access first"
    fi
fi

# Check environment file
echo "📋 Checking environment configuration..."
if [ -f "/var/www/toeicai/ToeicBoost_BE/.env" ]; then
    echo "✅ .env file exists"
else
    echo "❌ .env file missing"
    echo "Creating basic .env file..."
    cd /var/www/toeicai/ToeicBoost_BE
    cat > .env << 'ENVEOF'
NODE_ENV=production
APP_PORT=3001
APP_NAME=toeic-ai-api
API_PREFIX=api/v1

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=toeicai_user
DB_PASSWORD=StrongPassword123!
DB_DATABASE=toeicai
DB_SYNCHRONIZE=false
DB_LOGGING=false
DB_SSL=false

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

JWT_ACCESS_SECRET=production-access-secret-$(date +%s)
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_SECRET=production-refresh-secret-$(date +%s)
JWT_REFRESH_EXPIRATION=7d
ENVEOF
    echo "✅ Basic .env file created"
fi

# Check database
echo "📋 Checking database setup..."
sudo -u postgres psql -c "SELECT version();" 2>/dev/null && echo "✅ PostgreSQL is running" || echo "❌ PostgreSQL connection failed"

# Check if database user exists
if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='toeicai_user'" | grep -q 1; then
    echo "✅ Database user 'toeicai_user' exists"
else
    echo "Creating database user..."
    sudo -u postgres createuser -s toeicai_user 2>/dev/null || echo "User creation attempted"
    sudo -u postgres psql -c "ALTER USER toeicai_user PASSWORD 'StrongPassword123!';" 2>/dev/null || echo "Password set attempted"
fi

# Check if database exists
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw toeicai; then
    echo "✅ Database 'toeicai' exists"
else
    echo "Creating database..."
    sudo -u postgres createdb -O toeicai_user toeicai 2>/dev/null || echo "Database creation attempted"
fi

# Check Redis connection
echo "📋 Testing Redis connection..."
redis-cli ping 2>/dev/null && echo "✅ Redis is responding" || echo "❌ Redis connection failed"

# Check ports
echo "📋 Checking port availability..."
if sudo lsof -i :3001 >/dev/null 2>&1; then
    echo "⚠️ Port 3001 is in use:"
    sudo lsof -i :3001
else
    echo "✅ Port 3001 is available"
fi

echo ""
echo "🎉 SERVER ENVIRONMENT CHECK COMPLETED"
echo "===================================="
EOF

if [ $? -eq 0 ]; then
    print_success "Server environment setup completed!"
else
    print_error "Server environment setup failed"
    exit 1
fi

print_step "Testing deployment prerequisites..."

# Test if we can run a simple deployment
ssh -i "$KEY_PATH" "$SERVER_USER@$SERVER_HOST" << 'EOF'
echo "🧪 TESTING DEPLOYMENT PREREQUISITES"
echo "=================================="

cd /var/www/toeicai/ToeicBoost_BE || exit 1

# Test git operations
echo "Testing git fetch..."
git fetch origin main 2>&1 && echo "✅ Git fetch successful" || echo "❌ Git fetch failed"

# Test npm install (if package.json exists)
if [ -f "package.json" ]; then
    echo "Testing npm install..."
    npm install --production=false 2>&1 >/dev/null && echo "✅ npm install successful" || echo "❌ npm install failed"
    
    echo "Testing build..."
    npm run build 2>&1 >/dev/null && echo "✅ Build successful" || echo "❌ Build failed"
else
    echo "❌ package.json not found"
fi

echo "✅ Prerequisites test completed"
EOF

echo ""
print_success "Setup completed! Now try running the deployment again."
echo ""
echo "Next steps:"
echo "1. Run the Debug Deployment workflow to see detailed logs"
echo "2. If still failing, check the specific error messages"
echo "3. Run the main deployment workflow"