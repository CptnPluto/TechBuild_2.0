#!/bin/bash

# TechBuild 2.0 - Quick Development Environment Startup
# Starts all services preserving existing dependencies and setup

echo "⚡ Starting TechBuild 2.0 Development Environment (Quick Mode)..."
echo "This preserves existing dependencies and database state."
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

# Step 2: Start Backend (quick)
echo "🏗️ Step 2/4: Starting Backend Service..."
./scripts/start-backend.sh
if [ $? -ne 0 ]; then
    echo "❌ Backend startup failed"
    cleanup
    exit 1
fi
sleep 2
echo ""

# Step 3: Start AI Service (quick)
echo "🤖 Step 3/4: Starting AI Service..."
./scripts/start-ai-service.sh
if [ $? -ne 0 ]; then
    echo "❌ AI service startup failed"
    cleanup
    exit 1
fi
sleep 2
echo ""

# Step 4: Start Frontend (in foreground)
echo "🎨 Step 4/4: Starting Frontend Service..."

echo ""
echo "🎉 TechBuild 2.0 Development Environment Started Successfully!"
echo ""
echo "Services running:"
echo "  🎨 Frontend:      http://localhost:3000"
echo "  🏗️ Backend:       http://localhost:5001"
echo "  🤖 AI Service:    http://localhost:8000 (Landing.AI ONLY)"
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