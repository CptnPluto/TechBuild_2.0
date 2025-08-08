#!/bin/bash

# TechBuild 2.0 - Full Development Environment Startup
# Starts all services with fresh installations and setup

echo "🚀 Starting TechBuild 2.0 Full Development Environment..."
echo "This will start all services with fresh setup."
echo ""

# Check if we're in the right directory
if [ ! -f "CLAUDE.md" ]; then
    echo "❌ Please run this script from the TechBuild_2.0 root directory"
    exit 1
fi

# Create logs directory
mkdir -p logs

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    ./scripts/stop-dev.sh
    exit
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Step 1: Start Infrastructure
echo "📦 Step 1/4: Starting Infrastructure Services..."
./scripts/start-infrastructure.sh
if [ $? -ne 0 ]; then
    echo "❌ Infrastructure startup failed"
    exit 1
fi
echo ""

# Step 2: Setup and Start Backend
echo "🏗️ Step 2/4: Setting up and starting Backend Service..."
cd backend

# Install dependencies
if [ ! -d "node_modules" ] || [ "$1" = "--fresh" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Run database operations
echo "🗃️ Setting up database..."
npx prisma generate
npx prisma migrate deploy
npx prisma db seed 2>/dev/null || echo "⚠️ Database seeding skipped (may not be configured)"

cd ..

# Start backend service
./scripts/start-backend.sh
if [ $? -ne 0 ]; then
    echo "❌ Backend startup failed"
    cleanup
    exit 1
fi
sleep 3
echo ""

# Step 3: Setup and Start AI Service
echo "🤖 Step 3/4: Setting up and starting AI Service..."
./scripts/start-ai-service.sh
if [ $? -ne 0 ]; then
    echo "❌ AI service startup failed"
    cleanup
    exit 1
fi
sleep 3
echo ""

# Step 4: Setup and Start Frontend (in foreground)
echo "🎨 Step 4/4: Setting up and starting Frontend Service..."
cd frontend

# Install dependencies
if [ ! -d "node_modules" ] || [ "$1" = "--fresh" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

cd ..

echo ""
echo "🎉 TechBuild 2.0 Development Environment Started Successfully!"
echo ""
echo "Services running:"
echo "  🎨 Frontend:      http://localhost:3000"
echo "  🏗️ Backend:       http://localhost:5001"
echo "  🤖 AI Service:    http://localhost:8000"
echo "  📊 PostgreSQL:    localhost:5432"
echo "  🔴 Redis:         localhost:6379"
echo "  📁 MinIO:         localhost:9000"
echo ""
echo "📝 Logs location:"
echo "  Backend: logs/backend.log"
echo "  AI Service: logs/ai-service.log"
echo ""
echo "🚀 Starting frontend (will run in foreground)..."
echo "Press Ctrl+C to stop all services"
echo ""

# Start frontend in foreground
./scripts/start-frontend.sh