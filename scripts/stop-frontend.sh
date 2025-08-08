#!/bin/bash

# TechBuild 2.0 - Stop Frontend Service
# Stops the Next.js frontend development server

echo "🛑 Stopping TechBuild 2.0 Frontend Service..."

# Kill any processes on port 3000
echo "🔍 Checking for processes on port 3000..."
PIDS=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$PIDS" ]; then
    echo "🔄 Stopping processes on port 3000: $PIDS"
    kill $PIDS
    sleep 2
    
    # Force kill if still running
    PIDS=$(lsof -ti:3000 2>/dev/null)
    if [ ! -z "$PIDS" ]; then
        echo "⚡ Force stopping processes on port 3000: $PIDS"
        kill -9 $PIDS
    fi
fi

# Also kill any Next.js processes
echo "🔍 Stopping any remaining Next.js processes..."
pkill -f "next-server" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

echo "✅ Frontend service stopped successfully!"