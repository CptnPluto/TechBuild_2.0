#!/bin/bash

# TechBuild 2.0 - Start AI Service
# Starts the Python FastAPI AI service with Landing.AI integration

echo "🚀 Starting TechBuild 2.0 AI Service (Landing.AI)..."

# Change to ai-service directory
if [ ! -d "ai-service" ]; then
    echo "❌ AI service directory not found. Please run from project root directory."
    exit 1
fi

cd ai-service

# Check if main.py exists
if [ ! -f "main.py" ]; then
    echo "❌ AI service main.py not found. AI service may need to be restored."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🐍 Activating Python virtual environment..."
source venv/bin/activate

# Install/upgrade dependencies
echo "📦 Installing AI service dependencies..."
pip install -r requirements.txt

# Check if environment file exists
if [ ! -f ".env" ]; then
    echo "⚠️ AI service .env file not found. Creating from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
    else
        # Create basic .env with Landing.AI setup
        cat > .env << EOF
# AI Service Environment Variables
LANDING_AI_API_KEY=your_landing_ai_api_key_here
AI_SERVICE_PORT=8000
LOG_LEVEL=INFO

# Security Settings
SKIP_SECURITY_VALIDATION=false
EOF
        echo "✅ Created basic .env file - please add your Landing.AI API key"
    fi
fi

# Validate Landing.AI API key
LANDING_AI_KEY=$(grep LANDING_AI_API_KEY .env | cut -d '=' -f2)
if [ "$LANDING_AI_KEY" = "your_landing_ai_api_key_here" ] || [ -z "$LANDING_AI_KEY" ]; then
    echo "⚠️ Warning: Landing.AI API key not configured properly"
    echo "   Please edit .env file and set LANDING_AI_API_KEY"
fi

# Start AI service
echo "🤖 Starting AI service on port 8000..."

# Check logging mode
if [ "$LOGGING_MODE" = "console" ]; then
    python main.py
else
    # Create logs directory if it doesn't exist
    mkdir -p ../logs
    
    # Start with logging to file
    echo "📝 AI service logs will be written to: logs/ai-service.log"
    nohup python main.py > ../logs/ai-service.log 2>&1 &
    
    # Store PID
    echo $! > ../logs/ai-service.pid
    
    echo "✅ AI service started (PID: $!)"
    echo "   URL: http://localhost:8000"
    echo "   Logs: logs/ai-service.log"
    echo "   Provider: Landing.AI ONLY"
fi