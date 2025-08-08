import { Router } from 'express';
import { z } from 'zod';
import { aiService } from '@/services/ai';
import logger from '@/utils/logger';

const router = Router();

// Validation schemas
const processFileSchema = z.object({
  file_id: z.string().uuid('Invalid file ID'),
  processing_type: z.enum(['door_schedule', 'hardware_data', 'validation']),
  provider: z.string().optional(),
  options: z.object({
    confidence_threshold: z.number().min(0).max(1).optional(),
    retry_on_failure: z.boolean().optional()
  }).optional()
});

// Process file with AI
router.post('/process', async (req, res, next) => {
  try {
    const validatedData = processFileSchema.parse(req.body);
    
    logger.info('Processing file with AI', {
      fileId: validatedData.file_id,
      type: validatedData.processing_type,
      provider: validatedData.provider || 'landing_ai'
    });

    const processRequest = {
      file_id: validatedData.file_id,
      processing_type: validatedData.processing_type
    };

    if (validatedData.provider) {
      processRequest.provider = validatedData.provider;
    }

    if (validatedData.options) {
      processRequest.options = validatedData.options;
    }

    const result = await aiService.processFile(processRequest);

    return res.json({
      success: true,
      data: result,
      message: 'File processed successfully'
    });
  } catch (error) {
    next(error);
    return;
  }
});

// Get processing status
router.get('/process/:jobId/status', async (req, res, next) => {
  try {
    const { jobId } = req.params;
    
    logger.info(`Checking processing status: ${jobId}`);
    
    const status = await aiService.getProcessingStatus(jobId);
    
    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Processing job not found'
      });
    }

    return res.json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
    return;
  }
});

// Get available AI providers
router.get('/providers', async (req, res, next) => {
  try {
    logger.info('Fetching available AI providers');
    
    // For Landing.AI only setup, return Landing.AI as the sole provider
    const providers = [{
      name: 'landing_ai',
      enabled: true,
      model: 'agentic-doc',
      endpoint: process.env.AI_SERVICE_URL || 'http://localhost:8000',
      status: 'online',
      description: 'Landing.AI Agentic Document Extraction'
    }];

    return res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    next(error);
    return;
  }
});

// Test AI provider
router.post('/test-provider', async (req, res, next) => {
  try {
    const { provider = 'landing_ai' } = req.body;
    
    logger.info(`Testing AI provider: ${provider}`);
    
    const testResult = await aiService.testProvider(provider);
    
    return res.json({
      success: true,
      data: testResult,
      message: `Provider ${provider} test completed`
    });
  } catch (error) {
    next(error);
    return;
  }
});

// Compare providers (simplified for Landing.AI only)
router.post('/compare-providers', async (req, res, next) => {
  try {
    const { file_id, processing_type } = req.body;
    
    if (!file_id || !processing_type) {
      return res.status(400).json({
        success: false,
        error: 'file_id and processing_type are required'
      });
    }

    logger.info('Processing with Landing.AI (single provider)', {
      fileId: file_id,
      processingType: processing_type
    });

    // Since we only have Landing.AI, just process with it
    const result = await aiService.processFile({
      file_id,
      processing_type,
      provider: 'landing_ai'
    });

    return res.json({
      success: true,
      data: {
        fileId: file_id,
        processingType: processing_type,
        results: [{
          provider: 'landing_ai',
          status: 'completed',
          result
        }],
        recommendation: 'landing_ai',
        comparisonTimestamp: new Date().toISOString()
      },
      message: 'Processing completed with Landing.AI'
    });
  } catch (error) {
    next(error);
    return;
  }
});

export default router;