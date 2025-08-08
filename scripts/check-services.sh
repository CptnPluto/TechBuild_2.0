#!/bin/bash

# TechBuild 2.0 - Service Health Check
# Checks the status of all services and their health endpoints

echo "🔍 TechBuild 2.0 Service Health Check"
echo "====================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a port is open
check_port() {
    local port=$1
    local service_name=$2
    
    if lsof -i:$port > /dev/null 2>&1; then
        echo -e "✅ ${GREEN}$service_name${NC} - Port $port is open"
        return 0
    else
        echo -e "❌ ${RED}$service_name${NC} - Port $port is closed"
        return 1
    fi
}

# Function to check HTTP endpoint
check_endpoint() {
    local url=$1
    local service_name=$2
    local timeout=${3:-5}
    
    if curl -s --max-time $timeout "$url" > /dev/null 2>&1; then
        echo -e "✅ ${GREEN}$service_name${NC} - HTTP endpoint responding"
        return 0
    else
        echo -e "❌ ${RED}$service_name${NC} - HTTP endpoint not responding"
        return 1
    fi
}

# Function to check Docker service
check_docker_service() {
    local container_name=$1
    local service_name=$2
    
    if docker ps --filter "name=$container_name" --filter "status=running" | grep -q $container_name; then
        echo -e "✅ ${GREEN}$service_name${NC} - Docker container running"
        return 0
    else
        echo -e "❌ ${RED}$service_name${NC} - Docker container not running"
        return 1
    fi
}

# Check Docker daemon
echo "🐳 Checking Docker Services:"
echo "----------------------------"

if ! docker info > /dev/null 2>&1; then
    echo -e "❌ ${RED}Docker${NC} - Docker daemon not running"
    DOCKER_AVAILABLE=false
else
    echo -e "✅ ${GREEN}Docker${NC} - Docker daemon running"
    DOCKER_AVAILABLE=true
    
    # Check individual Docker services
    check_docker_service "postgres" "PostgreSQL"
    check_docker_service "redis" "Redis"
    check_docker_service "minio" "MinIO"
fi

echo ""

# Check Application Services
echo "🚀 Checking Application Services:"
echo "--------------------------------"

# Check Frontend (Next.js)
FRONTEND_STATUS=0
check_port 3000 "Frontend (Next.js)" || FRONTEND_STATUS=1
if [ $FRONTEND_STATUS -eq 0 ]; then
    check_endpoint "http://localhost:3000" "Frontend" || FRONTEND_STATUS=1
fi

echo ""

# Check Backend (Express.js)
BACKEND_STATUS=0
check_port 5001 "Backend (Express.js)" || BACKEND_STATUS=1
if [ $BACKEND_STATUS -eq 0 ]; then
    check_endpoint "http://localhost:5001/api/health" "Backend API" || BACKEND_STATUS=1
fi

echo ""

# Check AI Service (FastAPI)
AI_STATUS=0
check_port 8000 "AI Service (FastAPI)" || AI_STATUS=1
if [ $AI_STATUS -eq 0 ]; then
    check_endpoint "http://localhost:8000/health" "AI Service API" || AI_STATUS=1
    if curl -s "http://localhost:8000/health" | grep -q "landing_ai"; then
        echo -e "✅ ${GREEN}AI Service${NC} - Landing.AI integration active"
    else
        echo -e "⚠️ ${YELLOW}AI Service${NC} - Landing.AI status unclear"
    fi
fi

echo ""

# Database Connectivity Tests
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "🗃️ Checking Database Connectivity:"
    echo "----------------------------------"
    
    # Test PostgreSQL connection
    if docker exec postgres pg_isready -U techbuild > /dev/null 2>&1; then
        echo -e "✅ ${GREEN}PostgreSQL${NC} - Database connection successful"
    else
        echo -e "❌ ${RED}PostgreSQL${NC} - Database connection failed"
    fi
    
    # Test Redis connection
    if docker exec redis redis-cli ping | grep -q "PONG"; then
        echo -e "✅ ${GREEN}Redis${NC} - Cache connection successful"
    else
        echo -e "❌ ${RED}Redis${NC} - Cache connection failed"
    fi
    
    echo ""
fi

# Process Information
echo "📊 Process Information:"
echo "----------------------"

# Show process information for each service
for port in 3000 5001 8000; do
    PIDS=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$PIDS" ]; then
        SERVICE=$(case $port in
            3000) echo "Frontend" ;;
            5001) echo "Backend" ;;
            8000) echo "AI Service" ;;
        esac)
        echo "🔧 $SERVICE (Port $port): PID $PIDS"
    fi
done

echo ""

# Overall Status Summary
echo "📋 Overall Status Summary:"
echo "========================="

TOTAL_SERVICES=3
RUNNING_SERVICES=0

[ $FRONTEND_STATUS -eq 0 ] && RUNNING_SERVICES=$((RUNNING_SERVICES + 1))
[ $BACKEND_STATUS -eq 0 ] && RUNNING_SERVICES=$((RUNNING_SERVICES + 1))
[ $AI_STATUS -eq 0 ] && RUNNING_SERVICES=$((RUNNING_SERVICES + 1))

if [ $RUNNING_SERVICES -eq $TOTAL_SERVICES ]; then
    echo -e "🎉 ${GREEN}All services are running successfully!${NC}"
    echo ""
    echo "🌐 Access URLs:"
    echo "  Frontend:   http://localhost:3000"
    echo "  Backend:    http://localhost:5001"
    echo "  AI Service: http://localhost:8000"
    echo "  MinIO:      http://localhost:9000"
    exit 0
elif [ $RUNNING_SERVICES -eq 0 ]; then
    echo -e "🚨 ${RED}No services are running${NC}"
    echo ""
    echo "💡 To start services, run:"
    echo "  ./scripts/start-dev-quick.sh    # Quick start"
    echo "  ./scripts/start-dev.sh          # Full start"
    exit 1
else
    echo -e "⚠️ ${YELLOW}$RUNNING_SERVICES out of $TOTAL_SERVICES services are running${NC}"
    echo ""
    echo "💡 To start missing services, run individual scripts or:"
    echo "  ./scripts/start-dev-quick.sh    # Start all services"
    exit 1
fi