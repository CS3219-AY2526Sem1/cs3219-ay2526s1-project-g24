#!/bin/bash

# Collab Service - Complete Startup Script
# Starts PostgreSQL, Redis, and the collaboration service

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         Starting Collaboration Service                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required commands
if ! command_exists docker; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command_exists pnpm; then
    echo "❌ pnpm is not installed. Please install pnpm first."
    echo "   Run: npm install -g pnpm"
    exit 1
fi

# Step 1: Start Docker services
echo "🐳 Starting PostgreSQL and Redis with Docker Compose..."
docker compose up -d

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be ready..."
echo "   - PostgreSQL on port 5432"
echo "   - Redis on port 6379"
echo ""

# Wait for PostgreSQL
echo -n "   Waiting for PostgreSQL... "
for i in {1..30}; do
    if docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo "✅ Ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Timeout"
        exit 1
    fi
    sleep 1
done

# Wait for Redis
echo -n "   Waiting for Redis... "
for i in {1..30}; do
    if docker compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        echo "✅ Ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Timeout"
        exit 1
    fi
    sleep 1
done

echo ""

# Step 2: Check if database exists and run migrations
echo "🗄️  Setting up database..."

# Check if Prisma client is generated
if [ ! -d "node_modules/.prisma" ]; then
    echo "   Generating Prisma client..."
    pnpm prisma:generate
fi

# Run migrations
echo "   Running database migrations..."
pnpm prisma:migrate deploy 2>/dev/null || {
    echo "   Creating initial migration..."
    pnpm prisma:migrate dev --name init
}

echo ""

# Step 3: Show status
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                 Services Ready! 🎉                             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Service Status:"
docker compose ps
echo ""

echo "🔗 Connection Details:"
echo "   PostgreSQL: postgresql://postgres:postgres@localhost:5432/collab_dev"
echo "   Redis:      redis://localhost:6379"
echo ""

echo "🚀 Starting Collaboration Service..."
echo "   Server will start on: http://localhost:3003"
echo "   Mock Auth: ENABLED (see .env to change)"
echo ""
echo "📝 Logs will appear below. Press Ctrl+C to stop."
echo "─────────────────────────────────────────────────────────────────"
echo ""

# Step 4: Start the service
pnpm dev
