#!/bin/bash

# TechBuild 2.0 - Stop Backend Service
# Stops the Express.js backend server

echo "🛑 Stopping TechBuild 2.0 Backend Service..."

# Kill by PID if file exists
if [ -f "logs/backend.pid" ]; then
    PID=$(cat logs/backend.pid)
    if kill -0 $PID > /dev/null 2>&1; then
        echo "🔄 Stopping backend process (PID: $PID)..."
        kill $PID
        sleep 2
        
        # Force kill if still running
        if kill -0 $PID > /dev/null 2>&1; then
            echo "⚡ Force stopping backend process..."
            kill -9 $PID
        fi
    fi
    rm -f logs/backend.pid
fi

# Kill any remaining backend processes on port 5001
echo "🔍 Checking for processes on port 5001..."
PIDS=$(lsof -ti:5001 2>/dev/null)
if [ ! -z "$PIDS" ]; then
    echo "🔄 Stopping processes on port 5001: $PIDS"
    kill $PIDS
    sleep 2
    
    # Force kill if still running
    PIDS=$(lsof -ti:5001 2>/dev/null)
    if [ ! -z "$PIDS" ]; then
        echo "⚡ Force stopping processes on port 5001: $PIDS"
        kill -9 $PIDS
    fi
fi

echo "✅ Backend service stopped successfully!"