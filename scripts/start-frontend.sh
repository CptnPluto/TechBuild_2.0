#!/bin/bash

# TechBuild 2.0 - Start Frontend Service
# Starts the Next.js frontend development server

echo "🚀 Starting TechBuild 2.0 Frontend Service..."

# Change to frontend directory
if [ ! -d "frontend" ]; then
    echo "❌ Frontend directory not found. Please run from project root directory."
    exit 1
fi

cd frontend

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Frontend package.json not found. Frontend may need to be restored."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Check if environment file exists
if [ ! -f ".env.local" ]; then
    echo "⚠️ Frontend .env.local file not found. Creating from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
    else
        # Create basic .env.local with default values
        cat > .env.local << EOF
# Frontend Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000/api
EOF
        echo "✅ Created basic .env.local file"
    fi
fi

# Clear Next.js cache
echo "🧹 Clearing Next.js cache..."
rm -rf .next

# Start frontend service
echo "🚀 Starting frontend server on port 3000..."

# Check logging mode
if [ "$LOGGING_MODE" = "console" ]; then
    npm run dev
else
    # Create logs directory if it doesn't exist
    mkdir -p ../logs
    
    # Start with logging to file (frontend usually runs in foreground)
    echo "📝 Frontend starting in foreground mode..."
    echo "   URL: http://localhost:3000"
    npm run dev
fi