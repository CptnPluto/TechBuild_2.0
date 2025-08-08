#!/bin/bash

# TechBuild 2.0 - Stop Infrastructure Services
# Stops Docker services (PostgreSQL, Redis, MinIO)

echo "🛑 Stopping TechBuild 2.0 Infrastructure Services..."

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found. Please run from project root directory."
    exit 1
fi

# Stop infrastructure services
echo "📦 Stopping Docker services..."
docker-compose stop postgres redis minio

echo "✅ Infrastructure services stopped successfully!"
echo ""