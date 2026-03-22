#!/bin/bash

# Production deployment script
set -e

echo "🚀 Starting production deployment..."

# Configuration
PROJECT_DIR="/var/www/toeicai/ToeicBoost_BE"
BACKUP_DIR="/var/backups/toeicai"
COMPOSE_FILE="docker-compose.production.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   log_error "This script should not be run as root"
   exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed"
    exit 1
fi

# Create directories
log_info "Creating directories..."
sudo mkdir -p "$PROJECT_DIR"
sudo mkdir -p "$BACKUP_DIR"
sudo mkdir -p /var/log/toeicai
sudo chown -R $USER:$USER /var/www/toeicai
sudo chown -R $USER:$USER /var/log/toeicai

cd "$PROJECT_DIR"

# Backup current deployment
if [ -f "$COMPOSE_FILE" ]; then
    log_info "Creating backup..."
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME"
    
    # Export current database
    if docker-compose -f "$COMPOSE_FILE" ps postgres | grep -q "Up"; then
        log_info "Backing up database..."
        docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U toeicai_user toeicai > "$BACKUP_DIR/$BACKUP_NAME/database.sql"
    fi
    
    # Copy configuration files
    cp -r . "$BACKUP_DIR/$BACKUP_NAME/" 2>/dev/null || true
fi

# Pull latest images
log_info "Pulling latest Docker images..."
docker-compose -f "$COMPOSE_FILE" pull

# Stop services gracefully
log_info "Stopping services..."
docker-compose -f "$COMPOSE_FILE" down --timeout 30

# Start services
log_info "Starting services..."
docker-compose -f "$COMPOSE_FILE" up -d

# Wait for services to be healthy
log_info "Waiting for services to be healthy..."
timeout=300
elapsed=0

while [ $elapsed -lt $timeout ]; do
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up (healthy)"; then
        log_info "Services are healthy!"
        break
    fi
    
    echo "⏳ Waiting... ($elapsed/$timeout seconds)"
    sleep 10
    elapsed=$((elapsed + 10))
done

if [ $elapsed -ge $timeout ]; then
    log_error "Services failed to become healthy within timeout"
    docker-compose -f "$COMPOSE_FILE" logs --tail=50
    exit 1
fi

# Run database migrations
log_info "Running database migrations..."
docker-compose -f "$COMPOSE_FILE" exec -T api npm run migration:run

# Final health check
log_info "Performing health check..."
if curl -f -s http://localhost:3001/health > /dev/null; then
    log_info "✅ Deployment successful!"
else
    log_error "❌ Health check failed"
    exit 1
fi

# Cleanup old backups (keep last 5)
log_info "Cleaning up old backups..."
cd "$BACKUP_DIR"
ls -t | tail -n +6 | xargs -r rm -rf

log_info "🎉 Deployment completed successfully!"
echo "📊 Service status:"
docker-compose -f "$PROJECT_DIR/$COMPOSE_FILE" ps