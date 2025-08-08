# TechBuild 2.0 - Service Management Scripts

This directory contains comprehensive scripts to manage all services in the TechBuild 2.0 development environment.

## Quick Reference

### Root Directory Scripts (Convenience)
```bash
./start-dev-quick.sh      # Quick start all services
./start-dev.sh            # Full start with fresh setup
./stop-dev.sh             # Stop all services
./check-services.sh       # Check service health
```

### Main Scripts (scripts/ directory)

#### Full Environment Management
- `start-dev.sh` - Full development environment startup with fresh installations
- `start-dev-quick.sh` - Quick startup preserving existing dependencies
- `start-dev-console.sh` - Start with console logging (logs visible in terminal)
- `stop-dev.sh` - Stop all services in correct order
- `setup-environment.sh` - Initial environment setup from scratch

#### Individual Service Management
- `start-infrastructure.sh` / `stop-infrastructure.sh` - Docker services (PostgreSQL, Redis, MinIO)
- `start-backend.sh` / `stop-backend.sh` - Express.js backend server
- `start-frontend.sh` / `stop-frontend.sh` - Next.js frontend server
- `start-ai-service.sh` / `stop-ai-service.sh` - Python FastAPI AI service

#### Health Monitoring
- `check-services.sh` - Comprehensive health check for all services

## Service Architecture

### Services and Ports
- **Frontend (Next.js)**: http://localhost:3000
- **Backend (Express.js)**: http://localhost:5001
- **AI Service (FastAPI)**: http://localhost:8000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **MinIO**: localhost:9000

### Dependencies
- Frontend → Backend → Database
- Backend → AI Service → Landing.AI API
- All services → Infrastructure (PostgreSQL, Redis, MinIO)

## Usage Examples

### First Time Setup
```bash
# Complete environment setup (run once)
./scripts/setup-environment.sh

# Then start services
./start-dev-quick.sh
```

### Daily Development
```bash
# Quick start (preserves dependencies)
./start-dev-quick.sh

# Check if everything is running
./check-services.sh

# Stop when done
./stop-dev.sh
```

### Troubleshooting
```bash
# Start with console output to see logs
./scripts/start-dev-console.sh

# Check individual service health
./check-services.sh

# Start services one by one for debugging
./scripts/start-infrastructure.sh
./scripts/start-backend.sh
./scripts/start-ai-service.sh
./scripts/start-frontend.sh
```

### Fresh Start
```bash
# Full restart with fresh installations
./stop-dev.sh
./start-dev.sh --fresh
```

## Logging Options

### File Logging (Default)
```bash
./start-dev-quick.sh
# Logs written to:
# - logs/backend.log
# - logs/ai-service.log
# - Frontend runs in foreground
```

### Console Logging
```bash
# Set environment variable
export LOGGING_MODE=console
./start-dev-quick.sh

# Or use dedicated script
./scripts/start-dev-console.sh
```

## Environment Configuration

### Required Environment Files
- `backend/.env` - Backend configuration
- `frontend/.env.local` - Frontend configuration  
- `ai-service/.env` - AI service configuration (Landing.AI API key)

### Key Environment Variables
```bash
# AI Service
LANDING_AI_API_KEY=your_api_key_here
AI_SERVICE_PORT=8000

# Logging
LOGGING_MODE=console  # or file (default)

# Development
NODE_ENV=development
```

## Health Check Details

The `check-services.sh` script performs comprehensive health checks:

✅ **Port Availability**: Checks if services are listening on expected ports
✅ **HTTP Endpoints**: Tests actual API responsiveness
✅ **Docker Services**: Verifies infrastructure containers are running
✅ **Database Connectivity**: Tests PostgreSQL and Redis connections
✅ **Process Information**: Shows running process details
✅ **Overall Status**: Summary of system health

## Troubleshooting Common Issues

### Port Conflicts
```bash
# Check what's using a port
lsof -i :3000
lsof -i :5001
lsof -i :8000

# Kill processes on specific port
./stop-dev.sh  # Handles this automatically
```

### Docker Issues
```bash
# Restart Docker Desktop
# Then run
./scripts/start-infrastructure.sh
```

### Dependencies Out of Sync
```bash
# Full fresh start
./stop-dev.sh
./start-dev.sh --fresh
```

### Landing.AI API Issues
```bash
# Check configuration
cat ai-service/.env | grep LANDING_AI_API_KEY

# Test AI service health
curl http://localhost:8000/health
```

## Script Features

### Error Handling
- Comprehensive error checking
- Graceful cleanup on failures
- Clear error messages with troubleshooting hints

### Process Management
- PID tracking for background processes
- Signal handling for clean shutdowns
- Automatic port cleanup

### Logging
- Flexible logging modes (console/file)
- Structured log organization
- Service-specific log files

### Status Monitoring
- Real-time health checks
- Detailed service information
- Color-coded status indicators