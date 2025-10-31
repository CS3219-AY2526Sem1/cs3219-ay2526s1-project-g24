#!/bin/sh
set -e

echo "🚀 Collab Service - Starting..."

# Run database migrations
echo "📦 Running Prisma migrations..."
cd /app/apps/collab-service

# Run migrations (this is safe to run multiple times - it's idempotent)
npx prisma migrate deploy

echo "✅ Migrations complete"

# Go back to app root
cd /app

# Start the application
echo "🎯 Starting collab-service..."
exec node apps/collab-service/dist/index.js
