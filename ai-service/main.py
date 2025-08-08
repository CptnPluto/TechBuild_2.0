"""
TechBuild 2.0 AI Service
Landing.AI Integration - SOLE PROCESSING METHOD
"""

import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - streamlined for Landing.AI only."""
    logger.info("🚀 TechBuild 2.0 AI Service starting (Landing.AI ONLY)")
    
    # Validate Landing.AI API key
    landing_ai_key = os.getenv("LANDING_AI_API_KEY")
    if not landing_ai_key or landing_ai_key == "your_landing_ai_api_key_here":
        logger.warning("⚠️ Landing.AI API key not configured properly")
    else:
        logger.info("✅ Landing.AI API key found")
    
    yield
    
    logger.info("🛑 AI Service shutting down")

# Create FastAPI app
app = FastAPI(
    title="TechBuild 2.0 AI Service",
    description="Construction takeoff AI processing using Landing.AI exclusively",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routes
try:
    from api.routes.processing import router as processing_router
    app.include_router(processing_router, prefix="/api/ai")
    logger.info("✅ Processing routes loaded")
except ImportError as e:
    logger.error(f"❌ Failed to load processing routes: {e}")

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "TechBuild 2.0 AI Service",
        "version": "2.0.0",
        "processing_method": "Landing.AI ONLY",
        "status": "running"
    }

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "ai-service",
        "version": "2.0.0",
        "provider": "landing_ai_only"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AI_SERVICE_PORT", "8000"))
    logger.info(f"🚀 Starting AI Service on port {port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)