#!/bin/bash

# TechBuild 2.0 - Stop All Development Services
# Stops all running services in the correct order

echo "🛑 Stopping TechBuild 2.0 Development Environment..."
echo ""

# Stop services in reverse order (frontend -> ai -> backend -> infrastructure)

echo "🎨 Stopping Frontend Service..."
./scripts/stop-frontend.sh
echo ""

echo "🤖 Stopping AI Service..."
./scripts/stop-ai-service.sh
echo ""

echo "🏗️ Stopping Backend Service..."
./scripts/stop-backend.sh
echo ""

echo "📦 Stopping Infrastructure Services..."
./scripts/stop-infrastructure.sh
echo ""

# Clean up any remaining processes
echo "🧹 Cleaning up remaining processes..."

# Kill any remaining processes on our ports
for port in 3000 5001 8000; do
    PIDS=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$PIDS" ]; then
        echo "🔄 Cleaning up remaining processes on port $port: $PIDS"
        kill -9 $PIDS 2>/dev/null || true
    fi
done

# Clean up PID files
rm -f logs/backend.pid logs/ai-service.pid

echo "✅ All TechBuild 2.0 services stopped successfully!"
echo ""