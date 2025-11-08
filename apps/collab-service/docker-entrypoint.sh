#!/bin/sh
set -e

echo "🚀 Collab Service - Starting..."

# Run database migrations
echo "📦 Running Prisma migrations..."
cd /app/apps/collab-service

# If migrations folder is empty or missing, fall back to `prisma db push`
if [ ! -d "prisma/migrations" ] || [ -z "$(ls -A prisma/migrations | grep -v 'migration_lock.toml' | grep -v '.gitkeep' || true)" ]; then
	echo "⚠️  No Prisma migrations found in prisma/migrations — falling back to schema push"
	npx prisma db push
else
	# Run migrations (idempotent)
	npx prisma migrate deploy
fi

echo "✅ Migrations complete"

# Go back to app root
cd /app

# Start the application
echo "🎯 Starting collab-service..."
exec node apps/collab-service/dist/index.js
