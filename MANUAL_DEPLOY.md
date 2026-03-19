# Manual Deployment Guide

GitHub Actions đang gặp vấn đề với SSH authentication. Hãy deploy manual trực tiếp trên server:

## 🚀 Cách 1: SSH vào server và deploy

```bash
# 1. SSH vào server
ssh root@144.91.104.237

# 2. Navigate to project
cd /var/www/toeicai/ToeicBoost_BE

# 3. Run quick deploy script
bash quick-deploy.sh
```

## 🛠️ Cách 2: Manual commands từng bước

```bash
# SSH vào server
ssh root@144.91.104.237

# Navigate to project
cd /var/www/toeicai/ToeicBoost_BE

# Stop existing app
pkill -f "node.*dist/main.js" || true
pkill -f "npm.*start:prod" || true

# Update code
git fetch origin
git reset --hard origin/main

# Install dependencies
npm install

# Build project
npm run build

# Setup environment (if needed)
if [ ! -f .env ]; then
    cp .env.example .env
    sed -i 's/DB_HOST=localhost/DB_HOST=144.91.104.237/' .env
    sed -i 's/DB_PORT=5432/DB_PORT=5433/' .env
    sed -i 's/DB_USERNAME=postgres/DB_USERNAME=toeicai_user/' .env
    sed -i 's/DB_PASSWORD=postgres/DB_PASSWORD=StrongPassword123!/' .env
    sed -i 's/DB_DATABASE=toeic_ai/DB_DATABASE=toeicai/' .env
fi

# Start application
NODE_ENV=development nohup npm run start:prod > app.log 2>&1 &

# Check if it's running
sleep 10
curl http://localhost:3001/
```

## 📊 Verify Deployment

After deployment, check these URLs:

- 🌐 **Health**: http://144.91.104.237:3001/
- 📚 **Swagger**: http://144.91.104.237:3001/api/v1/docs
- 🔐 **Auth API**: http://144.91.104.237:3001/api/v1/auth/register

## 🔍 Troubleshooting

If something goes wrong:

```bash
# Check logs
tail -f app.log

# Check if process is running
ps aux | grep node

# Check port
netstat -tuln | grep 3001

# Restart if needed
pkill -f node
NODE_ENV=development npm run start:prod
```

## 🔧 Fix SSH for GitHub Actions (Optional)

To fix GitHub Actions later:

1. Generate new SSH key on server:
```bash
ssh-keygen -t rsa -b 4096 -C "github-actions"
```

2. Add public key to authorized_keys:
```bash
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
```

3. Copy private key to GitHub Secrets as `SERVER_SSH_KEY`

But for now, manual deployment works perfectly!