# TechBuild 2.0 - Construction Takeoff Automation

AI-powered construction takeoff automation that processes door schedules and hardware specifications to generate professional reports in minutes.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.10+
- Docker and Docker Compose
- Git

### Development Setup

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd TechBuild_2.0
   ```

2. **Start Development Environment**
   
   **First time setup:**
   ```bash
   ./start-dev.sh
   ```
   
   **Quick startup (after first run):**
   ```bash
   ./start-dev-quick.sh
   ```
   
   The scripts automatically:
   - Creates .env file from template
   - Sets up Docker containers (PostgreSQL, MinIO, Redis)  
   - Installs dependencies only if missing
   - Runs database migrations
   - Starts all services

3. **Access Applications**
   - 🌐 Frontend: http://localhost:3000
   - 🔧 Backend API: http://localhost:8080
   - 🤖 AI Service: http://localhost:8000
   - 📊 AI Docs: http://localhost:8000/docs
   - 💾 MinIO Console: http://localhost:9001

4. **Optional: Add AI API Keys**
   ```bash
   # Edit .env file to add your API keys
   nano .env
   # Add: OPENAI_API_KEY=sk-your-key-here
   # Add: ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```
   **Note:** App works without API keys using mock processing

5. **Stop Development Environment**
   ```bash
   ./stop-dev.sh
   ```

## 🏗️ Architecture

### Modern 3-Tier Architecture with MCP Integration

```
Frontend (Next.js 14) → Backend API (Node.js) → AI Service (Python/FastAPI)
                                ↓
                        Database (PostgreSQL) + File Storage (MinIO/S3)
                                ↓
                        MCP Servers (OpenAI, Claude, Morphic, Landing.ai)
```

### Key Features

- **Modular AI Providers**: Plug-and-play AI integration via Model Context Protocol (MCP)
- **Provider Comparison**: A/B test different AI providers on the same documents
- **Cost Optimization**: Intelligent routing to most cost-effective providers
- **Professional Reports**: Export to PDF, Excel, and CSV formats

## 📁 Project Structure

```
TechBuild_2.0/
├── frontend/           # Next.js 14 application
├── backend/           # Node.js API server with Prisma
├── ai-service/        # Python FastAPI with MCP integration
├── shared/           # Common TypeScript types
├── docker/           # Development environment
├── database/         # Database scripts and seeds
└── docs/            # Documentation
```

## 🤖 AI Provider Integration

### Supported Providers

- **OpenAI**: GPT-4 Turbo for structured data extraction
- **Claude**: Anthropic Claude for complex reasoning
- **Morphic.ai**: Specialized document AI (Coming in Phase 2)
- **Landing.ai**: Industrial data extraction (Coming in Phase 2)
- **Local Models**: Ollama integration for cost-effective processing

### Provider Configuration

```yaml
# ai-config.yaml
routing_rules:
  door_extraction:
    provider: "morphic"      # Best for construction documents
  hardware_extraction:
    provider: "landing"      # Best for technical specifications
  validation:
    provider: "openai"       # Best for structured validation
```

## 🔄 Development Phases

### ✅ Phase 1: Foundation & Core Data Flow (Complete)
- ✅ Project structure and Docker environment
- ✅ Next.js frontend with modern UI and TypeScript
- ✅ Node.js backend with Prisma ORM and updated packages
- ✅ Python AI service with modular MCP architecture
- ✅ File upload and complete data flow
- ✅ API key management and user-friendly status messages
- ✅ Works without API keys (shows configuration guidance)

### 🚧 Phase 2: Document Processing Pipeline (Next)
- Real AI integration with MCP servers
- OpenAI and Claude processing
- Morphic.ai and Landing.ai integration
- Advanced document preprocessing

### 📋 Phase 3: Business Logic Engine
- Construction-specific business rules
- Property assignment and validation
- Hardware set configuration
- Double door processing logic

### 📊 Phase 4: Calculations & Reporting
- Takeoff calculation engine
- Professional report generation
- Pricing integration
- Export functionality

### 🔐 Phase 5: Production Features
- Authentication and user management
- Performance optimization
- Production deployment
- Monitoring and analytics

## 🛠️ Development Commands

### Backend
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
```

### Frontend
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
```

### AI Service
```bash
cd ai-service
python main.py       # Start FastAPI server
pytest              # Run tests
```

## 🗄️ Database Schema

### Core Tables
- **projects**: Main project container
- **project_files**: Uploaded documents
- **door_schedules**: Extracted door data
- **hardware_components**: Hardware specifications
- **ai_processing_jobs**: AI processing status tracking

## 🔐 Environment Variables

Required environment variables (see `.env.example`):

```env
# Database
DATABASE_URL="postgresql://postgres:dev_password@localhost:5432/techbuild_dev"

# AI Providers (at least one required)
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
MORPHIC_API_KEY=your_morphic_key_here
LANDING_AI_API_KEY=your_landing_key_here

# File Storage
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

## 🚦 API Endpoints

### Backend API (Port 8080)
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `POST /api/files/upload` - Upload files
- `POST /api/ai/process` - Process with AI

### AI Service (Port 8000)
- `POST /api/processing/extract-door-schedule` - Extract door data
- `POST /api/processing/extract-hardware` - Extract hardware data
- `GET /api/providers/` - List AI providers
- `POST /api/providers/compare` - Compare providers

## 🧪 Testing

### Run All Tests
```bash
# Backend tests
cd backend && npm test

# AI service tests
cd ai-service && pytest

# Frontend tests
cd frontend && npm test
```

## 📈 Monitoring

Development logs are available in the `logs/` directory:
- `backend.log` - Backend API logs
- `ai-service.log` - AI service logs
- `frontend.log` - Frontend build logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📜 License

MIT License - see LICENSE file for details

## 🆘 Support

- Check the logs in `logs/` directory for errors
- Ensure all required environment variables are set
- Verify Docker services are running: `docker-compose ps`
- Check service health: `curl http://localhost:8080/health`

## 🎯 Roadmap

- [ ] **Phase 2**: Real AI integration with MCP servers
- [ ] **Phase 3**: Advanced business logic and validation
- [ ] **Phase 4**: Professional reporting and export
- [ ] **Phase 5**: Production deployment and scaling
- [ ] **Future**: Mobile app, advanced analytics, ERP integrations