#!/bin/bash

# TechBuild 2.0 - Console Development Environment Startup
# Starts all services with console logging (logs visible in terminal)

echo "💻 Starting TechBuild 2.0 Development Environment (Console Mode)..."
echo "All logs will be visible in the terminal."
echo ""

# Check if we're in the right directory
if [ ! -f "CLAUDE.md" ]; then
    echo "❌ Please run this script from the TechBuild_2.0 root directory"
    exit 1
fi

# Set console logging mode
export LOGGING_MODE=console

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

# Step 2: Start Backend in background with console output
echo "🏗️ Step 2/4: Starting Backend Service (console mode)..."
cd backend && npm run dev &
BACKEND_PID=$!
cd ..
sleep 3
echo "✅ Backend started (PID: $BACKEND_PID)"
echo ""

# Step 3: Start AI Service in background with console output  
echo "🤖 Step 3/4: Starting AI Service (console mode)..."
cd ai-service && source venv/bin/activate && python main.py &
AI_PID=$!
cd ..
sleep 3
echo "✅ AI Service started (PID: $AI_PID)"
echo ""

# Store PIDs for cleanup
echo $BACKEND_PID > logs/backend.pid
echo $AI_PID > logs/ai-service.pid

echo ""
echo "🎉 TechBuild 2.0 Development Environment Started Successfully!"
echo ""
echo "Services running:"
echo "  🎨 Frontend:      http://localhost:3000 (starting next...)"
echo "  🏗️ Backend:       http://localhost:5001 (PID: $BACKEND_PID)"
echo "  🤖 AI Service:    http://localhost:8000 (PID: $AI_PID)"
echo "  📊 PostgreSQL:    localhost:5432"
echo "  🔴 Redis:         localhost:6379"
echo "  📁 MinIO:         localhost:9000"
echo ""
echo "🚀 Starting frontend (will run in foreground with console output)..."
echo "Press Ctrl+C to stop all services"
echo ""

# Step 4: Start Frontend in foreground
./scripts/start-frontend.sh