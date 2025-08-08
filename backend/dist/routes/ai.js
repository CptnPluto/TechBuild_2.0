"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const ai_1 = require("@/services/ai");
const logger_1 = __importDefault(require("@/utils/logger"));
const router = (0, express_1.Router)();
const processFileSchema = zod_1.z.object({
    file_id: zod_1.z.string().uuid('Invalid file ID'),
    processing_type: zod_1.z.enum(['door_schedule', 'hardware_data', 'validation']),
    provider: zod_1.z.string().optional(),
    options: zod_1.z.object({
        confidence_threshold: zod_1.z.number().min(0).max(1).optional(),
        retry_on_failure: zod_1.z.boolean().optional()
    }).optional()
});
router.post('/process', async (req, res, next) => {
    try {
        const validatedData = processFileSchema.parse(req.body);
        logger_1.default.info('Processing file with AI', {
            fileId: validatedData.file_id,
            type: validatedData.processing_type,
            provider: validatedData.provider
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
        const result = await ai_1.aiService.processFile(processRequest);
        return res.json({
            success: true,
            data: result,
            message: 'File processed successfully'
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
router.get('/process/:jobId/status', async (req, res, next) => {
    try {
        const { jobId } = req.params;
        logger_1.default.info(`Checking processing status: ${jobId}`);
        const status = await ai_1.aiService.getProcessingStatus(jobId);
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
    }
    catch (error) {
        next(error);
        return;
    }
});
router.get('/providers', async (req, res, next) => {
    try {
        logger_1.default.info('Fetching available AI providers');
        const providers = await ai_1.aiService.getAvailableProviders();
        return res.json({
            success: true,
            data: providers
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
router.post('/test-provider', async (req, res, next) => {
    try {
        const { provider } = req.body;
        if (!provider) {
            return res.status(400).json({
                success: false,
                error: 'Provider name is required'
            });
        }
        logger_1.default.info(`Testing AI provider: ${provider}`);
        const testResult = await ai_1.aiService.testProvider(provider);
        return res.json({
            success: true,
            data: testResult,
            message: `Provider ${provider} test completed`
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
router.post('/compare-providers', async (req, res, next) => {
    try {
        const { file_id, providers, processing_type } = req.body;
        if (!file_id || !providers || !processing_type) {
            return res.status(400).json({
                success: false,
                error: 'file_id, providers array, and processing_type are required'
            });
        }
        logger_1.default.info('Comparing AI providers', {
            fileId: file_id,
            providers,
            processingType: processing_type
        });
        const comparison = await ai_1.aiService.compareProviders(file_id, providers, processing_type);
        return res.json({
            success: true,
            data: comparison,
            message: 'Provider comparison completed'
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
exports.default = router;
//# sourceMappingURL=ai.js.map