#!/bin/bash

# TechBuild 2.0 - Start Backend Service
# Starts the Express.js backend server

echo "🚀 Starting TechBuild 2.0 Backend Service..."

# Change to backend directory
if [ ! -d "backend" ]; then
    echo "❌ Backend directory not found. Please run from project root directory."
    exit 1
fi

cd backend

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Backend package.json not found. Backend may need to be restored."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Check if environment file exists
if [ ! -f ".env" ]; then
    echo "⚠️ Backend .env file not found. Creating from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
    else
        echo "❌ No .env.example found. Please create .env file manually."
        exit 1
    fi
fi

# Run database migrations
echo "🗃️ Running database migrations..."
npx prisma migrate deploy > /dev/null 2>&1 || echo "⚠️ Migration skipped (may need manual setup)"

# Start backend service
echo "🚀 Starting backend server on port 5001..."

# Check logging mode
if [ "$LOGGING_MODE" = "console" ]; then
    npm run dev
else
    # Create logs directory if it doesn't exist
    mkdir -p ../logs
    
    # Start with logging to file
    echo "📝 Backend logs will be written to: logs/backend.log"
    nohup npm run dev > ../logs/backend.log 2>&1 &
    
    # Store PID
    echo $! > ../logs/backend.pid
    
    echo "✅ Backend service started (PID: $!)"
    echo "   URL: http://localhost:5001"
    echo "   Logs: logs/backend.log"
fi