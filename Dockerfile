# Production Dockerfile - aligned with docker-compose production target
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Install dependencies first. Keep build tooling because production deploy
# currently runs migrations from inside the container after startup.
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "run", "start:prod"]
