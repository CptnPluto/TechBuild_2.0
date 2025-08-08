#!/bin/bash

# TechBuild 2.0 - Initial Environment Setup
# Sets up the development environment from scratch

echo "🛠️ TechBuild 2.0 - Initial Environment Setup"
echo "============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "CLAUDE.md" ]; then
    echo "❌ Please run this script from the TechBuild_2.0 root directory"
    exit 1
fi

echo "📋 This script will:"
echo "  1. Set up backend dependencies and database"
echo "  2. Set up frontend dependencies" 
echo "  3. Set up AI service Python environment"
echo "  4. Create environment files from templates"
echo "  5. Initialize database with migrations"
echo ""

read -p "Continue with setup? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 0
fi

echo ""

# Step 1: Backend Setup
echo "🏗️ Step 1/5: Setting up Backend..."
cd backend

if [ ! -f "package.json" ]; then
    echo "❌ Backend package.json not found. Please restore backend source files."
    exit 1
fi

echo "📦 Installing backend dependencies..."
npm install

echo "🔧 Setting up backend environment..."
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp .env.example .env
    echo "✅ Created .env from template"
fi

cd ..
echo ""

# Step 2: Frontend Setup  
echo "🎨 Step 2/5: Setting up Frontend..."
cd frontend

if [ ! -f "package.json" ]; then
    echo "❌ Frontend package.json not found. Please restore frontend source files."
    exit 1
fi

echo "📦 Installing frontend dependencies..."
npm install

echo "🔧 Setting up frontend environment..."
if [ ! -f ".env.local" ] && [ -f ".env.example" ]; then
    cp .env.example .env.local
elif [ ! -f ".env.local" ]; then
    # Create basic .env.local
    cat > .env.local << EOF
# Frontend Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000/api
EOF
    echo "✅ Created basic .env.local file"
fi

cd ..
echo ""

# Step 3: AI Service Setup
echo "🤖 Step 3/5: Setting up AI Service..."
cd ai-service

echo "🐍 Creating Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

echo "🐍 Activating virtual environment and installing dependencies..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "🔧 Setting up AI service environment..."
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp .env.example .env
elif [ ! -f ".env" ]; then
    # Create basic .env
    cat > .env << EOF
# AI Service Environment Variables
LANDING_AI_API_KEY=your_landing_ai_api_key_here
AI_SERVICE_PORT=8000
LOG_LEVEL=INFO

# Security Settings
SKIP_SECURITY_VALIDATION=false
EOF
    echo "✅ Created basic .env file"
fi

cd ..
echo ""

# Step 4: Infrastructure Setup
echo "📦 Step 4/5: Setting up Infrastructure..."

echo "🐳 Checking Docker availability..."
if ! docker info > /dev/null 2>&1; then
    echo "⚠️ Docker is not running. Please start Docker Desktop."
    echo "   Infrastructure services (PostgreSQL, Redis, MinIO) require Docker."
else
    echo "✅ Docker is running"
    
    if [ -f "docker-compose.yml" ]; then
        echo "📦 Pulling Docker images..."
        docker-compose pull postgres redis minio
        echo "✅ Docker images ready"
    else
        echo "⚠️ docker-compose.yml not found. Infrastructure setup may be incomplete."
    fi
fi

echo ""

# Step 5: Database Setup
echo "🗃️ Step 5/5: Setting up Database..."

echo "🚀 Starting infrastructure for database setup..."
./scripts/start-infrastructure.sh

echo "⏳ Waiting for database to be ready..."
sleep 10

echo "🔄 Running database setup..."
cd backend
npx prisma generate
npx prisma migrate deploy
npx prisma db seed 2>/dev/null || echo "⚠️ Database seeding skipped (may not be configured)"
cd ..

echo "✅ Database setup complete"
echo ""

# Final Summary
echo "🎉 Environment Setup Complete!"
echo "==============================="
echo ""
echo "✅ Backend dependencies installed"
echo "✅ Frontend dependencies installed" 
echo "✅ AI service Python environment ready"
echo "✅ Environment files created"
echo "✅ Database initialized"
echo ""
echo "🚀 To start all services:"
echo "  ./start-dev-quick.sh        # Quick start"
echo "  ./start-dev.sh              # Full start with fresh setup"
echo "  ./scripts/start-dev-console.sh  # Start with console logging"
echo ""
echo "🔍 To check service status:"
echo "  ./check-services.sh"
echo ""
echo "🛑 To stop all services:"
echo "  ./stop-dev.sh"
echo ""
echo "⚠️ Important: Please configure your API keys in the .env files:"
echo "  - ai-service/.env: Set LANDING_AI_API_KEY"
echo "  - backend/.env: Configure database and other settings"
echo ""