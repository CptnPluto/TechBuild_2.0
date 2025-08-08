"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = void 0;
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const errorHandler_1 = require("@/middleware/errorHandler");
const logger_1 = __importDefault(require("@/utils/logger"));
const configService_1 = require("./configService");
const loggingService_1 = __importDefault(require("./loggingService"));
const prisma = new client_1.PrismaClient();
exports.aiService = {
    async processFile(request) {
        try {
            logger_1.default.info('Starting AI file processing:', request);
            const file = await prisma.projectFile.findUnique({
                where: { id: request.file_id },
                include: {
                    project: {
                        select: { id: true, name: true }
                    }
                }
            });
            if (!file) {
                throw (0, errorHandler_1.createError)('File not found', 404);
            }
            const job = await prisma.aIProcessingJob.create({
                data: {
                    fileId: request.file_id,
                    provider: request.provider || await this.getDefaultProvider(),
                    jobType: request.processing_type,
                    status: 'pending',
                    startedAt: new Date()
                }
            });
            await prisma.projectFile.update({
                where: { id: request.file_id },
                data: { processingStatus: 'processing' }
            });
            this.processFileAsync(job.id, file, request)
                .catch(error => {
                logger_1.default.error(`Async processing failed for job ${job.id}:`, error);
            });
            return {
                jobId: job.id,
                status: 'started',
                message: 'File processing has been queued'
            };
        }
        catch (error) {
            logger_1.default.error('Error starting file processing:', error);
            if (error.statusCode) {
                throw error;
            }
            throw (0, errorHandler_1.createError)('Failed to start file processing', 500);
        }
    },
    async processFileAsync(jobId, file, request) {
        try {
            logger_1.default.info(`Processing file async: ${jobId}`);
            await loggingService_1.default.info(file.id, file.project.id, `Starting AI processing for file: ${file.filename}`, undefined, {
                jobId,
                provider: request.provider,
                processingType: request.processing_type,
                fileSize: file.fileSize
            }, jobId);
            await prisma.aIProcessingJob.update({
                where: { id: jobId },
                data: {
                    status: 'processing',
                    progress: 25
                }
            });
            const aiResult = await this.callRealAIService(file.id, request.processing_type, request.provider);
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
            const confidenceScore = aiResult.confidenceLevel ? aiResult.confidence : aiResult.confidence || 0.5;
            const requiresReview = aiResult.recommendedAction ?
                ['full_review', 're_extraction'].includes(aiResult.recommendedAction) :
                confidenceScore < 0.75;
            await prisma.projectFile.update({
                where: { id: file.id },
                data: {
                    processingStatus: 'completed',
                    processedData: aiResult.data,
                    confidence: confidenceScore,
                    ...(aiResult.confidenceLevel && {
                        metadata: {
                            confidenceLevel: aiResult.confidenceLevel,
                            recommendedAction: aiResult.recommendedAction,
                            hasDynamicConfidence: aiResult.hasDynamicConfidence || false,
                            requiresReview: requiresReview
                        }
                    })
                }
            });
            await loggingService_1.default.info(file.id, file.project.id, `AI processing completed successfully`, undefined, {
                jobId,
                confidence: confidenceScore,
                confidenceLevel: aiResult.confidenceLevel || 'unknown',
                recommendedAction: aiResult.recommendedAction || 'review_recommended',
                hasDynamicConfidence: aiResult.hasDynamicConfidence || false,
                requiresReview: requiresReview,
                provider: aiResult.provider,
                model: aiResult.model,
                processingComplete: true
            }, jobId);
            logger_1.default.info(`Completed processing job: ${jobId}`);
        }
        catch (error) {
            logger_1.default.error(`Error in async processing ${jobId}:`, error);
            await loggingService_1.default.error(file.id, file.project.id, `AI processing failed: ${error.message}`, undefined, {
                jobId,
                error: error.message,
                stack: error.stack,
                processingFailed: true
            }, jobId);
            await prisma.aIProcessingJob.update({
                where: { id: jobId },
                data: {
                    status: 'failed',
                    error: error.message,
                    completedAt: new Date()
                }
            });
            await prisma.projectFile.update({
                where: { id: file.id },
                data: { processingStatus: 'failed' }
            });
        }
    },
    async callRealAIService(fileId, processingType, provider) {
        try {
            const actualProvider = provider || await this.getDefaultProvider();
            logger_1.default.info(`Calling real AI service for file ${fileId} with provider ${actualProvider}`);
            const providerConfig = await configService_1.configService.getAIProviderConfig(actualProvider);
            const processingDefaults = await configService_1.configService.getProcessingDefaults();
            if (!await configService_1.configService.isProviderReady(actualProvider)) {
                throw new Error(`Provider ${actualProvider} is not ready or configured`);
            }
            const { documentProcessor } = await Promise.resolve().then(() => __importStar(require('./documentProcessor')));
            await documentProcessor.queueFileForProcessing(fileId, processingType);
            let attempts = 0;
            const maxAttempts = 30;
            while (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const file = await prisma.projectFile.findUnique({
                    where: { id: fileId }
                });
                if (file?.processingStatus === 'completed' && file.processedData) {
                    let confidence = file.confidence || processingDefaults.confidenceThreshold;
                    let confidenceLevel = 'unknown';
                    let recommendedAction = 'review_recommended';
                    const processedData = file.processedData;
                    if (processedData && processedData.backend_confidence) {
                        confidence = processedData.backend_confidence.confidence_score;
                        confidenceLevel = processedData.backend_confidence.confidence_level;
                        recommendedAction = processedData.backend_confidence.recommended_action;
                        logger_1.default.info(`📊 Using dynamic confidence: ${confidence.toFixed(3)} (${confidenceLevel})`);
                    }
                    else {
                        logger_1.default.info(`📊 Using fallback confidence: ${confidence} (dynamic confidence not available)`);
                    }
                    return {
                        data: file.processedData,
                        confidence: confidence,
                        confidenceLevel: confidenceLevel,
                        recommendedAction: recommendedAction,
                        provider: actualProvider,
                        success: true,
                        model: providerConfig.model,
                        tokens: providerConfig.maxTokens,
                        hasDynamicConfidence: !!(processedData && processedData.backend_confidence)
                    };
                }
                if (file?.processingStatus === 'failed') {
                    if (processingDefaults.fallbackProvider &&
                        actualProvider !== processingDefaults.fallbackProvider &&
                        !provider) {
                        logger_1.default.info(`Trying fallback provider: ${processingDefaults.fallbackProvider}`);
                        return await this.callRealAIService(fileId, processingType, processingDefaults.fallbackProvider);
                    }
                    throw new Error('AI processing failed');
                }
                attempts++;
            }
            throw new Error('AI processing timeout');
        }
        catch (error) {
            logger_1.default.error(`Error calling real AI service for file ${fileId}:`, error);
            throw error;
        }
    },
    generateMockResult(processingType, _filename) {
        switch (processingType) {
            case 'door_schedule':
                return {
                    doors: [
                        {
                            mark: '101',
                            door_type: 'Hollow Core',
                            door_material: 'Wood',
                            door_width: '3\'-0"',
                            door_height: '7\'-0"',
                            frame_type: 'Steel',
                            frame_material: 'Hollow Metal',
                            opening_type: 'SG',
                            quantity: 1,
                            hardware_set: 'Set A'
                        },
                        {
                            mark: '102',
                            door_type: 'Solid Core',
                            door_material: 'Wood',
                            door_width: '3\'-6"',
                            door_height: '7\'-0"',
                            frame_type: 'Steel',
                            frame_material: 'Hollow Metal',
                            opening_type: 'DBL',
                            quantity: 2,
                            hardware_set: 'Set B'
                        }
                    ],
                    extraction_info: {
                        pages_processed: 1,
                        total_doors_found: 2,
                        confidence_score: 0.85
                    }
                };
            case 'hardware_data':
                return {
                    hardware_sets: [
                        {
                            set_name: 'Set A',
                            components: [
                                {
                                    name: 'Mortise Lockset',
                                    type: 'Lock',
                                    quantity: 1,
                                    manufacturer: 'Schlage',
                                    model: 'L9453P'
                                },
                                {
                                    name: 'Ball Bearing Hinge',
                                    type: 'Hinge',
                                    quantity: 3,
                                    manufacturer: 'Hager',
                                    model: 'BB1191'
                                }
                            ]
                        }
                    ],
                    extraction_info: {
                        pages_processed: 1,
                        total_sets_found: 1,
                        confidence_score: 0.80
                    }
                };
            default:
                return {
                    validation_results: {
                        valid: true,
                        warnings: [],
                        errors: []
                    }
                };
        }
    },
    async getProcessingStatus(jobId) {
        try {
            logger_1.default.info(`Fetching processing status: ${jobId}`);
            const job = await prisma.aIProcessingJob.findUnique({
                where: { id: jobId }
            });
            return job;
        }
        catch (error) {
            logger_1.default.error(`Error fetching processing status ${jobId}:`, error);
            throw (0, errorHandler_1.createError)('Failed to fetch processing status', 500);
        }
    },
    async getAvailableProviders() {
        try {
            logger_1.default.info('Fetching available AI providers from hybrid configuration');
            const availableProviderNames = await configService_1.configService.getAvailableProviders();
            const providers = [];
            for (const providerName of availableProviderNames) {
                try {
                    const config = await configService_1.configService.getAIProviderConfig(providerName);
                    const isReady = await configService_1.configService.isProviderReady(providerName);
                    providers.push({
                        name: providerName,
                        enabled: config.enabled && isReady,
                        model: config.model,
                        endpoint: config.endpoint || process.env.AI_SERVICE_URL || `http://localhost:8000`,
                        status: isReady ? 'online' : 'offline'
                    });
                }
                catch (error) {
                    logger_1.default.warn(`Error getting config for provider ${providerName}:`, error);
                    providers.push({
                        name: providerName,
                        enabled: false,
                        model: 'unknown',
                        endpoint: process.env.AI_SERVICE_URL || `http://localhost:8000`,
                        status: 'error'
                    });
                }
            }
            return providers;
        }
        catch (error) {
            logger_1.default.error('Error fetching AI providers:', error);
            throw (0, errorHandler_1.createError)('Failed to fetch AI providers', 500);
        }
    },
    async testProvider(providerName) {
        try {
            logger_1.default.info(`Testing AI provider: ${providerName}`);
            const startTime = Date.now();
            const config = await configService_1.configService.getAIProviderConfig(providerName);
            const isReady = await configService_1.configService.isProviderReady(providerName);
            const processingDefaults = await configService_1.configService.getProcessingDefaults();
            if (!isReady) {
                const responseTime = Date.now() - startTime;
                return {
                    provider: providerName,
                    status: 'error',
                    responseTime,
                    testResult: 'Provider not configured or API key missing',
                    timestamp: new Date().toISOString(),
                    details: {
                        error: 'Provider not ready',
                        configuration: {
                            enabled: config.enabled,
                            hasApiKey: !!configService_1.configService.getAPIKey(providerName),
                            model: config.model,
                            endpoint: config.endpoint
                        }
                    }
                };
            }
            const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
            try {
                const healthResponse = await axios_1.default.get(`${AI_SERVICE_URL}/api/health`, {
                    timeout: 5000
                });
                if (healthResponse.status !== 200) {
                    throw new Error(`Health check failed: ${healthResponse.status}`);
                }
                if (providerName === 'openai') {
                    const testContent = Buffer.from('Test document for provider validation');
                    const FormData = require('form-data');
                    const formData = new FormData();
                    formData.append('file', testContent, {
                        filename: 'test.txt',
                        contentType: 'text/plain'
                    });
                    formData.append('provider', providerName);
                    formData.append('confidence_threshold', processingDefaults.confidenceThreshold.toString());
                    const testResponse = await axios_1.default.post(`${AI_SERVICE_URL}/api/processing/extract-door-schedule`, formData, {
                        headers: formData.getHeaders(),
                        timeout: 60000
                    });
                    const responseTime = Date.now() - startTime;
                    return {
                        provider: providerName,
                        status: testResponse.status === 200 ? 'online' : 'error',
                        responseTime,
                        testResult: testResponse.status === 200 ? 'Connection and processing test successful' : 'Processing test failed',
                        timestamp: new Date().toISOString(),
                        details: {
                            healthCheck: 'passed',
                            processingTest: testResponse.status === 200 ? 'passed' : 'failed',
                            configuration: {
                                model: config.model,
                                maxTokens: config.maxTokens,
                                endpoint: config.endpoint
                            }
                        }
                    };
                }
                else {
                    const responseTime = Date.now() - startTime;
                    return {
                        provider: providerName,
                        status: 'online',
                        responseTime,
                        testResult: 'Health check successful (provider-specific testing not implemented)',
                        timestamp: new Date().toISOString(),
                        details: {
                            healthCheck: 'passed',
                            processingTest: 'not_implemented',
                            configuration: {
                                model: config.model,
                                maxTokens: config.maxTokens,
                                endpoint: config.endpoint
                            }
                        }
                    };
                }
            }
            catch (apiError) {
                const responseTime = Date.now() - startTime;
                return {
                    provider: providerName,
                    status: 'error',
                    responseTime,
                    testResult: `Connection failed: ${apiError.message}`,
                    timestamp: new Date().toISOString(),
                    details: {
                        error: apiError.message,
                        healthCheck: 'failed',
                        configuration: {
                            model: config.model,
                            maxTokens: config.maxTokens,
                            endpoint: config.endpoint
                        }
                    }
                };
            }
        }
        catch (error) {
            logger_1.default.error(`Error testing provider ${providerName}:`, error);
            throw (0, errorHandler_1.createError)('Provider test failed', 500);
        }
    },
    async compareProviders(fileId, providers, processingType) {
        try {
            logger_1.default.info('Comparing AI providers:', { fileId, providers, processingType });
            const results = [];
            for (const provider of providers) {
                try {
                    const startTime = Date.now();
                    const aiResult = await this.callRealAIService(fileId, processingType, provider);
                    const processingTime = Date.now() - startTime;
                    results.push({
                        provider,
                        confidence: aiResult.confidence,
                        processingTime,
                        accuracy: aiResult.confidence,
                        cost: this.estimateProviderCost(provider, processingTime),
                        status: 'completed',
                        data: aiResult.data
                    });
                }
                catch (error) {
                    logger_1.default.error(`Provider ${provider} failed:`, error);
                    results.push({
                        provider,
                        confidence: 0,
                        processingTime: 0,
                        accuracy: 0,
                        cost: 0,
                        status: 'failed',
                        error: error.message
                    });
                }
            }
            const successfulResults = results.filter(r => r.status === 'completed');
            const bestProvider = successfulResults.length > 0
                ? successfulResults.reduce((best, current) => current.confidence > best.confidence ? current : best).provider
                : providers[0];
            return {
                fileId,
                processingType,
                results,
                recommendation: bestProvider,
                comparisonTimestamp: new Date().toISOString()
            };
        }
        catch (error) {
            logger_1.default.error('Error comparing providers:', error);
            throw (0, errorHandler_1.createError)('Provider comparison failed', 500);
        }
    },
    estimateProviderCost(provider, processingTime) {
        const baseCosts = {
            'openai': 0.02,
            'anthropic': 0.015,
            'morphic': 0.01,
            'landing': 0.025
        };
        const baseCost = baseCosts[provider] || 0.02;
        const timeFactor = processingTime / 1000;
        return Number((baseCost * (1 + timeFactor * 0.1)).toFixed(4));
    },
    async getDefaultProvider() {
        try {
            const processingDefaults = await configService_1.configService.getProcessingDefaults();
            logger_1.default.info(`Using default provider: ${processingDefaults.defaultProvider}`);
            return processingDefaults.defaultProvider;
        }
        catch (error) {
            logger_1.default.error('Error getting default provider:', error);
            return 'openai';
        }
    },
    async getConfiguredProviders() {
        try {
            return await configService_1.configService.getAvailableProviders();
        }
        catch (error) {
            logger_1.default.error('Error getting configured providers:', error);
            return ['openai'];
        }
    }
};
//# sourceMappingURL=ai.js.map