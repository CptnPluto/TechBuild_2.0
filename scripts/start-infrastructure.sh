#!/bin/bash

# TechBuild 2.0 - Start Infrastructure Services
# Starts Docker services (PostgreSQL, Redis, MinIO)

echo "🚀 Starting TechBuild 2.0 Infrastructure Services..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found. Please run from project root directory."
    exit 1
fi

# Start infrastructure services
echo "📦 Starting Docker services (PostgreSQL, Redis, MinIO)..."
docker-compose up -d postgres redis minio

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if PostgreSQL is ready
echo "🔍 Checking PostgreSQL connection..."
for i in {1..30}; do
    if docker exec postgres pg_isready -U techbuild > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ PostgreSQL failed to start within 30 seconds"
        exit 1
    fi
    sleep 1
done

# Check if Redis is ready
echo "🔍 Checking Redis connection..."
for i in {1..30}; do
    if docker exec redis redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Redis failed to start within 30 seconds"
        exit 1
    fi
    sleep 1
done

echo "🎉 Infrastructure services started successfully!"
echo ""
echo "Services running:"
echo "  📊 PostgreSQL: localhost:5432"
echo "  🔴 Redis: localhost:6379"
echo "  📁 MinIO: localhost:9000"
echo ""