#!/bin/bash
# Quick setup script for Docker Compose

set -e

echo "🚀 Setting up Question Service with Docker Compose"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ Created .env file with default password"
else
    echo "✅ .env file already exists"
fi

# Create network if it doesn't exist
if ! docker network inspect app_network >/dev/null 2>&1; then
    echo "🌐 Creating Docker network..."
    docker network create app_network
    echo "✅ Created app_network"
else
    echo "✅ Docker network app_network already exists"
fi

echo ""
echo "🐳 Starting services with Docker Compose..."
docker-compose up -d --build

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

echo ""
echo "✅ Setup complete!"
echo ""
echo "📊 Service Status:"
docker-compose ps
echo ""
echo "🌐 Access Points:"
echo "   - Question Service API: http://localhost:8000/docs"
echo "   - Health Check: http://localhost:8000/health"
echo "   - Database: localhost:5433"
echo ""
echo "📝 Useful Commands:"
echo "   - View logs: docker-compose logs -f question_service"
echo "   - Stop services: docker-compose down"
echo "   - Restart: docker-compose restart question_service"
echo ""
echo "📖 See DOCKER_SETUP.md for detailed documentation"
