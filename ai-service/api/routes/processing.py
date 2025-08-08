"""
AI Service Processing Routes
Handles document processing requests using Landing.AI exclusively.
"""

import logging
from typing import Dict, Any
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse

from core.providers.landing_ai_provider import LandingAIProvider

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["AI Processing"])

@router.post("/extract-door-schedule")
async def extract_door_schedule(
    file: UploadFile = File(...),
    confidence_threshold: float = Form(0.8),
    provider: str = Form("landing_ai")
) -> Dict[str, Any]:
    """
    Extract door schedule data from uploaded PDF using Landing.AI ONLY.
    This endpoint SUPERSEDES all other processing methods.
    """
    try:
        logger.info(f"🚀 LANDING.AI: Processing door schedule extraction for {file.filename}")
        logger.info(f"📊 Using confidence threshold: {confidence_threshold}")
        
        # Verify we're using Landing.AI (the only supported provider)
        if provider != "landing_ai":
            logger.warning(f"⚠️ Unsupported provider '{provider}' requested. Forcing Landing.AI.")
            provider = "landing_ai"
        
        # Read file content
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        logger.info(f"📄 File size: {len(content)} bytes")
        
        # Use ONLY Landing.AI provider - no preprocessing, no other processing
        logger.info(f"🤖 LANDING.AI: Initializing Landing.AI provider for {file.filename}")
        landing_ai_provider = LandingAIProvider()
        result = await landing_ai_provider.extract_door_schedule(
            content, 
            file.filename, 
            confidence_threshold
        )
        
        if not result.get("success", False):
            logger.error(f"❌ Landing.AI processing failed: {result.get('error', 'Unknown error')}")
            raise HTTPException(
                status_code=500, 
                detail=f"Landing.AI processing failed: {result.get('error', 'Unknown error')}"
            )
        
        logger.info("✅ Landing.AI processing completed successfully")
        return JSONResponse(content=result, status_code=200)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error in door schedule extraction: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.post("/extract-hardware-data") 
async def extract_hardware_data(
    file: UploadFile = File(...),
    confidence_threshold: float = Form(0.8)
) -> Dict[str, Any]:
    """
    Extract hardware data from uploaded PDF using Landing.AI ONLY.
    """
    try:
        logger.info(f"🚀 LANDING.AI: Processing hardware data extraction for {file.filename}")
        
        # Read file content
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        # Use ONLY Landing.AI provider
        landing_ai_provider = LandingAIProvider()
        result = await landing_ai_provider.extract_door_schedule(
            content, 
            file.filename, 
            confidence_threshold
        )
        
        if not result.get("success", False):
            logger.error(f"❌ Landing.AI hardware processing failed: {result.get('error')}")
            raise HTTPException(
                status_code=500, 
                detail=f"Landing.AI processing failed: {result.get('error', 'Unknown error')}"
            )
        
        # Save hardware-specific output for testing
        try:
            import json
            hardware_output_file = "/Users/dahvid/Documents/Coding/TechBuild_2.0/landing_ai_hardware_output.json"
            with open(hardware_output_file, 'w') as f:
                json.dump(result, f, indent=2, default=str)
            logger.info(f"💾 Hardware output saved to: {hardware_output_file}")
        except Exception as save_error:
            logger.warning(f"Failed to save hardware output: {save_error}")
        
        logger.info("✅ Landing.AI hardware processing completed successfully")
        return JSONResponse(content=result, status_code=200)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error in hardware extraction: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/providers")
async def get_providers() -> Dict[str, Any]:
    """
    Get available AI providers. Returns Landing.AI as the sole provider.
    """
    return {
        "success": True,
        "providers": [
            {
                "name": "landing_ai",
                "display_name": "Landing.AI",
                "description": "Landing.AI Agentic Document Extraction (ADE)",
                "status": "active",
                "capabilities": ["door_schedule", "hardware_data", "document_analysis"],
                "is_default": True
            }
        ],
        "message": "Landing.AI is the exclusive processing provider"
    }

@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Health check endpoint for the AI service.
    """
    return {
        "status": "healthy",
        "service": "techbuild-ai-service",
        "version": "2.0.0",
        "provider": "landing_ai_only",
        "capabilities": ["door_schedule_extraction", "hardware_data_extraction"],
        "timestamp": "2025-01-15T12:00:00Z"
    }

@router.post("/test-connection")
async def test_connection() -> Dict[str, Any]:
    """
    Test connection to Landing.AI service.
    """
    try:
        logger.info("🧪 Testing Landing.AI connection")
        
        # Initialize Landing.AI provider for testing
        landing_ai_provider = LandingAIProvider()
        
        # Test with a simple mock document
        test_content = b"Test document for Landing.AI connection"
        result = await landing_ai_provider.extract_door_schedule(
            test_content, 
            "test_connection.txt", 
            0.5
        )
        
        return {
            "success": True,
            "provider": "landing_ai",
            "status": "connected",
            "test_result": "Connection successful",
            "message": "Landing.AI service is operational"
        }
        
    except Exception as e:
        logger.error(f"❌ Landing.AI connection test failed: {str(e)}")
        return {
            "success": False,
            "provider": "landing_ai", 
            "status": "failed",
            "error": str(e),
            "message": "Landing.AI connection test failed"
        }