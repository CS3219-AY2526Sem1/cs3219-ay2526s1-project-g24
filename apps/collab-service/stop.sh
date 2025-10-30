#!/bin/bash

# Collab Service - Stop Script
# Stops the collaboration service and Docker containers

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         Stopping Collaboration Service                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Stop Docker services
echo "🛑 Stopping PostgreSQL and Redis..."
docker compose down

echo ""
echo "✅ Services stopped!"
echo ""
echo "💡 To remove data volumes, run:"
echo "   docker compose down -v"
echo ""
