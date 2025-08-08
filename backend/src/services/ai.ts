import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { createError } from '@/middleware/errorHandler';
import logger from '@/utils/logger';

const prisma = new PrismaClient();

interface ProcessFileRequest {
  file_id: string;
  processing_type: 'door_schedule' | 'hardware_data' | 'validation';
  provider?: string;
  options?: {
    confidence_threshold?: number;
    retry_on_failure?: boolean;
  };
}

interface ProcessFileResult {
  jobId: string;
  status: string;
  message: string;
}

interface AIProcessingJob {
  id: string;
  fileId: string;
  provider: string;
  jobType: string;
  status: string;
  progress?: number;
  result?: any;
  error?: string;
  confidence?: number;
  startedAt: Date;
  completedAt?: Date;
}

export const aiService = {
  async processFile(request: ProcessFileRequest): Promise<ProcessFileResult> {
    try {
      logger.info('🤖 Starting AI file processing:', request);

      // Find the file in database
      const file = await prisma.projectFile.findUnique({
        where: { id: request.file_id },
        include: {
          project: {
            select: { id: true, name: true }
          }
        }
      });

      if (!file) {
        throw createError('File not found', 404);
      }

      // Create processing job
      const job = await prisma.aIProcessingJob.create({
        data: {
          fileId: request.file_id,
          provider: 'landing_ai', // Force Landing.AI as the sole provider
          jobType: request.processing_type,
          status: 'pending',
          startedAt: new Date()
        }
      });

      // Update file status
      await prisma.projectFile.update({
        where: { id: request.file_id },
        data: { processingStatus: 'processing' }
      });

      // Process file asynchronously with Landing.AI
      this.processFileAsync(job.id, file, request)
        .catch(error => {
          logger.error(`❌ Async processing failed for job ${job.id}:`, error);
        });

      return {
        jobId: job.id,
        status: 'started',
        message: 'File processing has been queued for Landing.AI'
      };
    } catch (error) {
      logger.error('❌ Error starting file processing:', error);
      if ((error as any).statusCode) {
        throw error;
      }
      throw createError('Failed to start file processing', 500);
    }
  },

  async processFileAsync(jobId: string, file: any, request: ProcessFileRequest): Promise<void> {
    try {
      logger.info(`🚀 Processing file async with Landing.AI: ${jobId}`);

      // Update job status to processing
      await prisma.aIProcessingJob.update({
        where: { id: jobId },
        data: {
          status: 'processing',
          progress: 25
        }
      });

      // Call Landing.AI service
      const aiResult = await this.callLandingAIService(file.id, request.processing_type);

      // Update job as completed
      await prisma.aIProcessingJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          progress: 100,
          result: aiResult.data,
          confidence: aiResult.confidence,
          completedAt: new Date()
        }
      });

      // Update file with processed data
      await prisma.projectFile.update({
        where: { id: file.id },
        data: {
          processingStatus: 'completed',
          processedData: aiResult.data,
          confidence: aiResult.confidence,
          metadata: {
            provider: 'landing_ai',
            model: 'agentic-doc',
            processingType: request.processing_type,
            processedAt: new Date().toISOString()
          }
        }
      });

      logger.info(`✅ Completed processing job: ${jobId}`);
    } catch (error) {
      logger.error(`❌ Error in async processing ${jobId}:`, error);

      // Mark job as failed
      await prisma.aIProcessingJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          error: (error as Error).message,
          completedAt: new Date()
        }
      });

      // Mark file as failed
      await prisma.projectFile.update({
        where: { id: file.id },
        data: { processingStatus: 'failed' }
      });
    }
  },

  async callLandingAIService(fileId: string, processingType: string): Promise<any> {
    try {
      const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      logger.info(`🤖 Calling Landing.AI service for file ${fileId}`);

      // Get file data from database
      const file = await prisma.projectFile.findUnique({
        where: { id: fileId }
      });

      if (!file || !file.filePath) {
        throw new Error('File not found or file path missing');
      }

      // For now, send a simple request to our AI service
      // In a real implementation, you would send the actual file content
      const response = await axios.post(
        `${AI_SERVICE_URL}/api/ai/extract-door-schedule`, 
        {
          filename: file.filename,
          processing_type: processingType,
          confidence_threshold: 0.8
        },
        {
          timeout: 60000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status !== 200) {
        throw new Error(`Landing.AI service responded with status ${response.status}`);
      }

      return {
        data: response.data,
        confidence: response.data.extraction_summary?.average_confidence || 0.85,
        provider: 'landing_ai',
        success: true
      };
    } catch (error) {
      logger.error(`❌ Error calling Landing.AI service for file ${fileId}:`, error);
      throw error;
    }
  },

  async getProcessingStatus(jobId: string): Promise<AIProcessingJob | null> {
    try {
      logger.info(`📊 Fetching processing status: ${jobId}`);
      
      const job = await prisma.aIProcessingJob.findUnique({
        where: { id: jobId }
      });

      return job as AIProcessingJob | null;
    } catch (error) {
      logger.error(`❌ Error fetching processing status ${jobId}:`, error);
      throw createError('Failed to fetch processing status', 500);
    }
  },

  async testProvider(providerName: string = 'landing_ai'): Promise<any> {
    try {
      logger.info(`🧪 Testing AI provider: ${providerName}`);
      const startTime = Date.now();

      if (providerName !== 'landing_ai') {
        return {
          provider: providerName,
          status: 'error',
          responseTime: Date.now() - startTime,
          testResult: 'Only Landing.AI provider is supported',
          timestamp: new Date().toISOString()
        };
      }

      const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

      // Test health endpoint
      const healthResponse = await axios.get(`${AI_SERVICE_URL}/health`, {
        timeout: 5000
      });

      const responseTime = Date.now() - startTime;

      return {
        provider: providerName,
        status: healthResponse.status === 200 ? 'online' : 'error',
        responseTime,
        testResult: healthResponse.status === 200 ? 'Landing.AI service is healthy' : 'Service health check failed',
        timestamp: new Date().toISOString(),
        details: {
          healthCheck: healthResponse.status === 200 ? 'passed' : 'failed',
          serviceUrl: AI_SERVICE_URL,
          provider: 'Landing.AI ADE (Agentic Document Extraction)'
        }
      };
    } catch (error) {
      logger.error(`❌ Error testing provider ${providerName}:`, error);
      
      return {
        provider: providerName,
        status: 'error',
        responseTime: Date.now(),
        testResult: `Connection failed: ${(error as Error).message}`,
        timestamp: new Date().toISOString(),
        details: {
          error: (error as Error).message,
          healthCheck: 'failed'
        }
      };
    }
  }
};