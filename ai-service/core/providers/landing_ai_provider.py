"""
Landing.AI Provider for TechBuild 2.0
Provides document processing using Landing.AI's Agentic Document Extraction (ADE) API.
This provider SUPERSEDES ALL OTHER PROCESSING METHODS.
"""

import json
import logging
from typing import Dict, Any, List, Optional
from agentic_doc import DocClient

logger = logging.getLogger(__name__)

class LandingAIProvider:
    """
    Landing.AI provider for construction document processing.
    Uses Landing.AI's Agentic Document Extraction API exclusively.
    """
    
    def __init__(self):
        """Initialize Landing.AI provider."""
        self.client = None
        logger.info("🤖 Landing.AI Provider initialized")
    
    async def extract_door_schedule(
        self, 
        content: bytes, 
        filename: str, 
        confidence_threshold: float = 0.8
    ) -> Dict[str, Any]:
        """
        Extract door schedule data using Landing.AI ONLY.
        No preprocessing, no other AI providers, no deep learning.
        
        Args:
            content: PDF file content as bytes
            filename: Name of the uploaded file
            confidence_threshold: Minimum confidence threshold (ignored for Landing.AI)
            
        Returns:
            Structured extraction results in standard format
        """
        try:
            logger.info(f"🚀 LANDING.AI: Starting extraction for {filename}")
            
            # Initialize client if not already done
            if not self.client:
                self.client = DocClient()
                logger.info("✅ Landing.AI client initialized")
            
            # Process document with Landing.AI
            logger.info("📄 Sending document to Landing.AI ADE API...")
            
            # Convert bytes to file-like object for Landing.AI
            from io import BytesIO
            pdf_file = BytesIO(content)
            pdf_file.name = filename
            
            # Call Landing.AI API
            response = self.client.extract(pdf_file)
            logger.info("✅ Landing.AI extraction completed successfully")
            
            # Parse the response chunks
            tables = []
            metadata = {
                "provider": "landing_ai",
                "filename": filename,
                "confidence_threshold": confidence_threshold,
                "extraction_method": "landing_ai_ade"
            }
            
            # Process chunks from Landing.AI response
            if hasattr(response, 'chunks') and response.chunks:
                logger.info(f"📊 Processing {len(response.chunks)} chunks from Landing.AI")
                
                for i, chunk in enumerate(response.chunks):
                    # Convert chunk object to dictionary
                    chunk_data = {}
                    if hasattr(chunk, '__dict__'):
                        chunk_data = {k: getattr(chunk, k) for k in dir(chunk) if not k.startswith('_')}
                    else:
                        # Try to extract key attributes
                        for attr in ['text', 'confidence', 'bbox', 'page', 'type']:
                            if hasattr(chunk, attr):
                                chunk_data[attr] = getattr(chunk, attr)
                    
                    # Create table structure
                    table = {
                        "chunk_id": i,
                        "data": chunk_data,
                        "confidence": getattr(chunk, 'confidence', 1.0),
                        "page": getattr(chunk, 'page', 1),
                        "text": getattr(chunk, 'text', str(chunk)),
                        "extraction_method": "landing_ai"
                    }
                    tables.append(table)
                    
                logger.info(f"✅ Processed {len(tables)} tables from Landing.AI chunks")
            else:
                logger.warning("⚠️ No chunks found in Landing.AI response")
            
            # Build result structure
            result = {
                "success": True,
                "raw_extraction_data": {
                    "tables": tables,
                    "metadata": metadata,
                    "total_chunks": len(tables),
                    "provider": "landing_ai"
                },
                "metadata": metadata,
                "extraction_summary": {
                    "total_tables": len(tables),
                    "confidence_scores": [table.get("confidence", 1.0) for table in tables],
                    "average_confidence": sum(table.get("confidence", 1.0) for table in tables) / max(len(tables), 1),
                    "provider": "landing_ai"
                }
            }
            
            # TEMPORARY: Save Landing.AI output to local JSON file for testing
            try:
                output_file = "/Users/dahvid/Documents/Coding/TechBuild_2.0/landing_ai_output.json"
                with open(output_file, 'w') as f:
                    json.dump(result, f, indent=2, default=str)
                logger.info(f"💾 Landing.AI output saved to: {output_file}")
            except Exception as save_error:
                logger.warning(f"Failed to save output file: {save_error}")
            
            logger.info(f"🎉 Landing.AI extraction completed: {len(tables)} chunks processed")
            return result
            
        except Exception as e:
            logger.error(f"❌ Landing.AI extraction failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "raw_extraction_data": {"tables": [], "metadata": metadata},
                "metadata": metadata,
                "extraction_summary": {
                    "total_tables": 0,
                    "error": str(e),
                    "provider": "landing_ai"
                }
            }