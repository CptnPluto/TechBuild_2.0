#!/bin/bash

# TechBuild 2.0 - Stop AI Service
# Stops the Python FastAPI AI service

echo "🛑 Stopping TechBuild 2.0 AI Service..."

# Kill by PID if file exists
if [ -f "logs/ai-service.pid" ]; then
    PID=$(cat logs/ai-service.pid)
    if kill -0 $PID > /dev/null 2>&1; then
        echo "🔄 Stopping AI service process (PID: $PID)..."
        kill $PID
        sleep 2
        
        # Force kill if still running
        if kill -0 $PID > /dev/null 2>&1; then
            echo "⚡ Force stopping AI service process..."
            kill -9 $PID
        fi
    fi
    rm -f logs/ai-service.pid
fi

# Kill any remaining processes on port 8000
echo "🔍 Checking for processes on port 8000..."
PIDS=$(lsof -ti:8000 2>/dev/null)
if [ ! -z "$PIDS" ]; then
    echo "🔄 Stopping processes on port 8000: $PIDS"
    kill $PIDS
    sleep 2
    
    # Force kill if still running
    PIDS=$(lsof -ti:8000 2>/dev/null)
    if [ ! -z "$PIDS" ]; then
        echo "⚡ Force stopping processes on port 8000: $PIDS"
        kill -9 $PIDS
    fi
fi

# Also kill any uvicorn processes
echo "🔍 Stopping any remaining uvicorn processes..."
pkill -f "uvicorn" 2>/dev/null || true
pkill -f "main:app" 2>/dev/null || true

echo "✅ AI service stopped successfully!"