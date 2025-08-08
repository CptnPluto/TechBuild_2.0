# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current Datetime

The date is currently August 8th, 2025 - as of the writing of this note. All research and implementations should reflect the most recent technologies as of this date.

## Project Status

**TechBuild 2.0 - Construction Takeoff Application with AI Integration**

Phase 1 (Foundation & Core Data Flow) - **COMPLETE**

-   ✅ Frontend UI with Next.js 15.4.3 and production-ready styling
-   ✅ Backend API with Express, TypeScript, and Prisma ORM
-   ✅ AI service foundation with Python FastAPI
-   ✅ Database schema and migrations
-   ✅ File upload simulation interface
-   ✅ Professional SaaS-style UI design system

Current Status: **Phase 2 Active** - Backend integration complete, AI extraction enhanced and debugged
**LATEST UPDATE**: Landing.AI implemented as SOLE document processing method, superseding ALL other processing methods.

**Recent Updates (Landing.AI Integration)**:

-   ✅ Landing.AI integrated as the exclusive document processing provider
-   ✅ All other processing methods (deep learning, OCR, etc.) superseded by Landing.AI
-   ✅ Frontend compatibility fixed for Landing.AI response format
-   ✅ JSON output files added for testing and validation
-   ✅ Dependency conflicts resolved by streamlining requirements

## Technology Stack

### Frontend

-   **Framework**: Next.js 15.4.3 with App Router
-   **Styling**: Tailwind CSS 3.4.13 with PostCSS
-   **Components**: Headless UI, Heroicons
-   **Forms**: React Hook Form with Zod validation
-   **State Management**: TanStack Query (React Query)
-   **File Upload**: React Dropzone
-   **Language**: TypeScript

### Backend

-   **Runtime**: Node.js with Express 4.19.2
-   **Database**: PostgreSQL with Prisma ORM 6.12.0
-   **Language**: TypeScript
-   **File Storage**: MinIO (S3-compatible)
-   **Caching**: Redis
-   **Logging**: Winston

### AI Service

-   **Framework**: Python FastAPI
-   **AI Integration**: **Landing.AI ONLY** - all other providers superseded
-   **Processing**: Landing.AI Agentic Document Extraction (ADE)
-   **Security**: Comprehensive secrets management and API key validation

## Development Setup

### Prerequisites

-   Node.js 18+
-   Python 3.9+
-   PostgreSQL
-   Redis (optional for caching)
-   Landing.AI API Key

### Quick Start

```bash
# Quick start (preserves dependencies and database)
./start-dev-quick.sh

# Individual service control
./scripts/start-infrastructure.sh  # Start Docker services
./scripts/start-backend.sh         # Start backend only
./scripts/start-frontend.sh        # Start frontend only
./scripts/start-ai-service.sh      # Start AI service only (Landing.AI)
```

### AI Service Development (Landing.AI Only)

```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python main.py     # Development server on :8000
```

## Landing.AI Integration

### Key Implementation Details

-   **Provider**: `/ai-service/core/providers/landing_ai_provider.py`
-   **API**: Uses agentic-doc v0.3.1 library
-   **Processing**: Direct document → Landing.AI → results (no preprocessing)
-   **Output**: Saves results to `landing_ai_output.json` for testing
-   **Configuration**: API key in `.env` as `LANDING_AI_API_KEY`

### Critical Requirements

-   **SUPERSEDES ALL OTHER PROCESSING METHODS**
-   **ONLY Landing.AI** - no deep learning, OCR, preprocessing, etc.
-   **Simple workflow**: upload → Landing.AI → parse → display
-   **No model downloads or initialization required**

## Development Guidance

### 🚨 CRITICAL - MANDATORY Agent Usage 🚨

**ALL WORK MUST USE APPROPRIATE AGENTS** - This is non-negotiable:

-   **AI/Machine Learning work**: Use `ai-expert-advisor` agent
-   **Backend development**: Use `backend-architect` agent  
-   **Database work**: Use `database-architect` agent
-   **Frontend work**: Use `frontend-architect` agent
-   **DevOps/Deployment**: Use `devops-deployment-specialist` agent
-   **Major completions**: Use `senior-project-manager` agent
-   **System testing**: Use `fullstack-qa-engineer` agent

### Security & Secrets Management

-   **NEVER commit real API keys** to version control
-   **Always use placeholder values** in committed configuration files
-   **Landing.AI API key** must be in `.env` file only

## Troubleshooting

### Landing.AI Issues
-   **API key not set**: Check `.env` file has `LANDING_AI_API_KEY=your_key_here`
-   **Service startup**: Ensure only Landing.AI dependencies are installed
-   **Processing fails**: Check `landing_ai_output.json` for detailed error information

### General Issues
-   **Build errors**: Clear `.next` directory and rebuild
-   **Database issues**: Run `npm run db:migrate` and `npm run db:generate`
-   **Port conflicts**: Check scripts for port configurations

## Important Notes

-   **Landing.AI is now the SOLE processing method**
-   **All other AI providers are superseded and should not be used**
-   **Frontend parsing supports Landing.AI response format**
-   **JSON output files are saved for testing and debugging**
-   **Streamlined dependencies - only Landing.AI and core FastAPI**

## File Recovery Information

This CLAUDE.md file was recreated after a .gitignore configuration issue. If other critical files are missing, they may need to be restored from backups or recreated based on the project requirements.