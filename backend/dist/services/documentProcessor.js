"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentProcessor = void 0;
const client_1 = require("@prisma/client");
const errorHandler_1 = require("@/middleware/errorHandler");
const logger_1 = __importDefault(require("@/utils/logger"));
const minio_1 = require("@/config/minio");
const cache_1 = require("@/utils/cache");
const axios_1 = __importDefault(require("axios"));
const prisma = new client_1.PrismaClient();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
exports.documentProcessor = {
    async queueFileForProcessing(fileId, taskType = 'door_schedule') {
        try {
            logger_1.default.info(`🚀 QUEUE START: Queueing file ${fileId} for ${taskType} processing`);
            logger_1.default.info(`🔍 QUEUE STEP 1: Looking up file ${fileId} in database`);
            const file = await prisma.projectFile.findUnique({
                where: { id: fileId },
                include: { project: true }
            });
            if (!file) {
                logger_1.default.error(`❌ QUEUE ERROR: File ${fileId} not found in database`);
                throw (0, errorHandler_1.createError)('File not found', 404);
            }
            logger_1.default.info(`✅ QUEUE STEP 1 COMPLETE: File found`, {
                fileId: file.id,
                filename: file.filename,
                currentStatus: file.processingStatus,
                projectId: file.projectId,
                projectName: file.project.name
            });
            logger_1.default.info(`🔄 QUEUE STEP 2: Updating file status to 'processing'`);
            await prisma.projectFile.update({
                where: { id: fileId },
                data: { processingStatus: 'processing' }
            });
            logger_1.default.info(`✅ QUEUE STEP 2 COMPLETE: File status updated to 'processing'`);
            const job = {
                id: `job_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                fileId,
                taskType,
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            logger_1.default.info(`🎯 QUEUE STEP 3: Created processing job`, {
                jobId: job.id,
                fileId: job.fileId,
                taskType: job.taskType
            });
            logger_1.default.info(`🚀 QUEUE STEP 4: Starting background processing for job ${job.id}`);
            this.processFileAsync(job).catch(error => {
                logger_1.default.error(`💥 BACKGROUND PROCESSING FAILED for job ${job.id}:`, error);
            });
            logger_1.default.info(`✅ QUEUE COMPLETE: File ${fileId} successfully queued as job ${job.id}`);
            return job;
        }
        catch (error) {
            logger_1.default.error(`❌ QUEUE FAILED: Error queueing file ${fileId} for processing:`, error);
            throw error;
        }
    },
    async processFileAsync(job) {
        try {
            logger_1.default.info(`🔥 ASYNC START: Starting async processing for job ${job.id}`);
            await this.createProcessingLog(job.fileId, 'INFO', 'Processing started', null, {
                jobId: job.id,
                taskType: job.taskType,
                status: 'started'
            });
            logger_1.default.info(`📁 ASYNC STEP 1: Fetching file ${job.fileId} from database`);
            const file = await prisma.projectFile.findUnique({
                where: { id: job.fileId }
            });
            if (!file) {
                logger_1.default.error(`❌ ASYNC ERROR: File ${job.fileId} not found in database`);
                await this.createProcessingLog(job.fileId, 'ERROR', 'File not found in database', null, {
                    jobId: job.id,
                    fileId: job.fileId
                });
                throw new Error('File not found');
            }
            logger_1.default.info(`✅ ASYNC STEP 1 COMPLETE: File found`, {
                filename: file.filename,
                filePath: file.filePath,
                fileSize: file.fileSize
            });
            await this.createProcessingLog(job.fileId, 'INFO', 'File retrieved from database', null, {
                jobId: job.id,
                filename: file.filename,
                fileSize: file.fileSize
            });
            logger_1.default.info(`📥 ASYNC STEP 2: Downloading file content from MinIO path: ${file.filePath}`);
            const fileBuffer = await (0, minio_1.downloadFile)(file.filePath);
            logger_1.default.info(`✅ ASYNC STEP 2 COMPLETE: File downloaded`, {
                bufferSize: fileBuffer.length
            });
            await this.createProcessingLog(job.fileId, 'INFO', 'File downloaded from storage', null, {
                jobId: job.id,
                bufferSize: fileBuffer.length,
                filePath: file.filePath
            });
            const endpoint = job.taskType === 'door_schedule'
                ? '/api/processing/extract-door-schedule'
                : '/api/processing/extract-hardware';
            logger_1.default.info(`🤖 ASYNC STEP 3: Preparing AI service file upload`, {
                endpoint,
                taskType: job.taskType,
                fileSize: fileBuffer.length,
                filename: file.filename
            });
            await this.createProcessingLog(job.fileId, 'INFO', 'Starting AI extraction process', null, {
                jobId: job.id,
                endpoint,
                taskType: job.taskType,
                provider: 'ai-service'
            });
            const aiResponse = await this.callAIServiceWithFile(endpoint, fileBuffer, file.filename);
            logger_1.default.info(`✅ ASYNC STEP 3 COMPLETE: AI service response received`, {
                status: aiResponse.status,
                hasData: !!aiResponse.data,
                hasErrors: !!aiResponse.errors
            });
            if (aiResponse.success === true) {
                await this.createProcessingLog(job.fileId, 'INFO', 'AI extraction completed successfully', null, {
                    jobId: job.id,
                    extractionMethods: aiResponse.extraction_methods_used || [],
                    totalTables: aiResponse.total_tables_found || 0,
                    confidence: aiResponse.confidence || 0
                });
                logger_1.default.info(`💾 ASYNC STEP 4: Updating database with successful AI results`);
                await prisma.projectFile.update({
                    where: { id: job.fileId },
                    data: {
                        processingStatus: 'completed',
                        processedData: aiResponse.data
                    }
                });
                const rawExtractionData = aiResponse.raw_extraction_data ||
                    (aiResponse.data && aiResponse.data.raw_extracted_data);
                if (rawExtractionData) {
                    logger_1.default.info(`📊 ASYNC STEP 4B: Saving raw extraction data to database`);
                    await this.saveRawExtractionData(job.fileId, file.projectId, rawExtractionData);
                    if (rawExtractionData.extraction_methods_used) {
                        for (const method of rawExtractionData.extraction_methods_used) {
                            await this.createProcessingLog(job.fileId, 'INFO', `Extraction method completed: ${method}`, method, {
                                jobId: job.id,
                                tablesFound: rawExtractionData.metadata?.[`${method}_tables`] || 0,
                                confidence: rawExtractionData.confidence_scores?.[method] || 0
                            });
                        }
                    }
                }
                else {
                    logger_1.default.warn(`⚠️ ASYNC STEP 4B: No raw extraction data found in AI response`, {
                        hasData: !!aiResponse.data,
                        hasTopLevelRawData: !!aiResponse.raw_extraction_data,
                        hasNestedRawData: !!(aiResponse.data && aiResponse.data.raw_extracted_data),
                        responseKeys: Object.keys(aiResponse),
                        dataKeys: aiResponse.data ? Object.keys(aiResponse.data) : []
                    });
                    await this.createProcessingLog(job.fileId, 'WARN', 'No raw extraction data found in AI response', null, {
                        jobId: job.id,
                        responseKeys: Object.keys(aiResponse)
                    });
                }
                await this.createProcessingLog(job.fileId, 'INFO', 'Processing completed successfully', null, {
                    jobId: job.id,
                    status: 'completed',
                    finalTables: aiResponse.data?.doors?.length || 0
                });
                logger_1.default.info(`🎉 ASYNC COMPLETE: Successfully processed file ${job.fileId} with AI service`);
            }
            else {
                await this.createProcessingLog(job.fileId, 'ERROR', 'AI processing failed', null, {
                    jobId: job.id,
                    errors: aiResponse.errors || [],
                    status: 'failed'
                });
                logger_1.default.error(`💾 ASYNC STEP 4: Updating database with AI processing failure`);
                await prisma.projectFile.update({
                    where: { id: job.fileId },
                    data: {
                        processingStatus: 'failed',
                        processedData: {
                            error: aiResponse.errors?.[0]?.message || 'Processing failed',
                            timestamp: new Date()
                        }
                    }
                });
                logger_1.default.error(`AI service processing failed for file ${job.fileId}:`, aiResponse.errors);
            }
            await cache_1.cache.del(cache_1.cacheKeys.files.byProject(file.projectId));
            await cache_1.cache.del(cache_1.cacheKeys.projects.byId(file.projectId));
        }
        catch (error) {
            logger_1.default.error(`Error in async processing for job ${job.id}:`, error);
            try {
                await this.createProcessingLog(job.fileId, 'ERROR', `Processing failed: ${error.message}`, null, {
                    jobId: job.id,
                    error: error.message,
                    stack: error.stack,
                    status: 'failed'
                });
            }
            catch (logError) {
                logger_1.default.error(`Failed to log processing error:`, logError);
            }
            try {
                await prisma.projectFile.update({
                    where: { id: job.fileId },
                    data: {
                        processingStatus: 'failed',
                        processedData: {
                            error: error.message || 'Processing failed',
                            timestamp: new Date()
                        }
                    }
                });
            }
            catch (updateError) {
                logger_1.default.error(`Failed to update file status:`, updateError);
            }
        }
    },
    async getProcessingStatus(fileId) {
        try {
            const file = await prisma.projectFile.findUnique({
                where: { id: fileId },
                select: {
                    id: true,
                    filename: true,
                    processingStatus: true,
                    processedData: true,
                    updatedAt: true
                }
            });
            if (!file) {
                throw (0, errorHandler_1.createError)('File not found', 404);
            }
            return {
                fileId: file.id,
                filename: file.filename,
                status: file.processingStatus,
                result: file.processedData,
                lastUpdated: file.updatedAt
            };
        }
        catch (error) {
            logger_1.default.error(`Error getting processing status:`, error);
            throw error;
        }
    },
    async getProjectResults(projectId) {
        try {
            const files = await prisma.projectFile.findMany({
                where: {
                    projectId,
                    processingStatus: 'completed',
                    processedData: { not: null }
                },
                select: {
                    id: true,
                    filename: true,
                    fileType: true,
                    processedData: true,
                    updatedAt: true
                },
                orderBy: { updatedAt: 'desc' }
            });
            return files.map(file => ({
                fileId: file.id,
                filename: file.filename,
                fileType: file.fileType,
                results: file.processedData,
                processedAt: file.updatedAt
            }));
        }
        catch (error) {
            logger_1.default.error(`Error getting project results:`, error);
            throw error;
        }
    },
    async callAIService(endpoint, data) {
        try {
            const fullUrl = `${AI_SERVICE_URL}${endpoint}`;
            logger_1.default.info(`🌐 AI SERVICE CALL: Making request to ${fullUrl}`, {
                endpoint,
                dataSize: JSON.stringify(data).length
            });
            const response = await fetch(fullUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            logger_1.default.info(`📡 AI SERVICE RESPONSE: Received response`, {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });
            if (!response.ok) {
                const errorText = await response.text();
                logger_1.default.error(`❌ AI SERVICE ERROR: Request failed`, {
                    status: response.status,
                    statusText: response.statusText,
                    errorBody: errorText
                });
                throw new Error(`AI Service error: ${response.status} - ${errorText}`);
            }
            const responseData = await response.json();
            logger_1.default.info(`✅ AI SERVICE SUCCESS: Response parsed`, {
                hasData: !!responseData,
                responseKeys: responseData && typeof responseData === 'object' ? Object.keys(responseData) : []
            });
            return responseData;
        }
        catch (error) {
            logger_1.default.error(`💥 AI SERVICE FAILED: Call to AI service failed`, {
                endpoint,
                error: error.message,
                stack: error.stack
            });
            throw new Error(`AI Service unavailable: ${error.message}`);
        }
    },
    async callAIServiceWithFile(endpoint, fileBuffer, filename) {
        try {
            const fullUrl = `${AI_SERVICE_URL}${endpoint}`;
            logger_1.default.info(`🌐 AI SERVICE FILE UPLOAD: Making multipart request to ${fullUrl}`, {
                endpoint,
                filename,
                fileSize: fileBuffer.length
            });
            const FormData = require('form-data');
            const formData = new FormData();
            formData.append('file', fileBuffer, {
                filename: filename,
                contentType: this.getMimeTypeFromFilename(filename)
            });
            formData.append('provider', process.env.DEFAULT_AI_PROVIDER || 'openai');
            formData.append('confidence_threshold', process.env.AI_CONFIDENCE_THRESHOLD || '0.8');
            const headers = formData.getHeaders();
            logger_1.default.info(`📋 FORM DATA HEADERS:`, headers);
            logger_1.default.info(`📦 FORM DATA DEBUG:`, {
                hasFile: formData._streams?.length > 0,
                streamCount: formData._streams?.length || 0,
                boundary: formData.getBoundary?.() || 'unknown'
            });
            const response = await axios_1.default.post(fullUrl, formData, {
                headers: headers,
                timeout: 240000,
                maxContentLength: 50 * 1024 * 1024,
                maxBodyLength: 50 * 1024 * 1024
            });
            logger_1.default.info(`📡 AI SERVICE RESPONSE: Received response`, {
                status: response.status,
                statusText: response.statusText,
                hasData: !!response.data
            });
            if (response.status < 200 || response.status >= 300) {
                logger_1.default.error(`❌ AI SERVICE ERROR: Request failed`, {
                    status: response.status,
                    statusText: response.statusText,
                    errorBody: JSON.stringify(response.data)
                });
                throw new Error(`AI Service error: ${response.status} - ${JSON.stringify(response.data)}`);
            }
            const responseData = response.data;
            logger_1.default.info(`✅ AI SERVICE SUCCESS: Response parsed`, {
                hasData: !!responseData,
                responseKeys: responseData && typeof responseData === 'object' ? Object.keys(responseData) : []
            });
            return responseData;
        }
        catch (error) {
            if (error.response) {
                logger_1.default.error(`💥 AI SERVICE FAILED: File upload to AI service failed`, {
                    endpoint,
                    filename,
                    status: error.response.status,
                    statusText: error.response.statusText,
                    errorData: JSON.stringify(error.response.data),
                    error: error.message
                });
                throw new Error(`AI Service error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            }
            else if (error.request) {
                logger_1.default.error(`💥 AI SERVICE FAILED: No response from AI service`, {
                    endpoint,
                    filename,
                    error: error.message,
                    stack: error.stack
                });
                throw new Error(`AI Service unavailable: No response received`);
            }
            else {
                logger_1.default.error(`💥 AI SERVICE FAILED: Request setup error`, {
                    endpoint,
                    filename,
                    error: error.message,
                    stack: error.stack
                });
                throw new Error(`AI Service unavailable: ${error.message}`);
            }
        }
    },
    getMimeTypeFromFilename(filename) {
        const extension = filename.toLowerCase().split('.').pop();
        const mimeTypes = {
            'pdf': 'application/pdf',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'xls': 'application/vnd.ms-excel',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'doc': 'application/msword'
        };
        return mimeTypes[extension || ''] || 'application/octet-stream';
    },
    async saveRawExtractionData(fileId, projectId, rawData) {
        try {
            logger_1.default.info(`📊 Saving raw extraction data for file ${fileId}`);
            const extractionMethods = rawData.extraction_methods_used ||
                (rawData.metadata?.method_table_counts ? Object.keys(rawData.metadata.method_table_counts) : []);
            const textContent = rawData.text_content || '';
            const tables = rawData.tables || [];
            const rawResults = rawData.raw_data || {};
            const confidenceScores = rawData.confidence_scores || (rawData.metadata?.confidence_scores || {});
            const metadata = {
                filename: rawData.metadata?.filename || '',
                file_size: rawData.metadata?.file_size || 0,
                total_extraction_methods: rawData.metadata?.total_extraction_methods || 0,
                processing_timestamp: new Date().toISOString(),
                ...rawData.metadata
            };
            const totalTables = Array.isArray(tables) ? tables.length : 0;
            const totalTextLength = typeof textContent === 'string' ? textContent.length : 0;
            const existingData = await prisma.rawExtractionData.findFirst({
                where: { fileId: fileId }
            });
            if (existingData) {
                await prisma.rawExtractionData.update({
                    where: { id: existingData.id },
                    data: {
                        extractionMethods: extractionMethods,
                        textContent: textContent,
                        tablesData: tables,
                        rawResults: rawResults,
                        confidenceScores: confidenceScores,
                        metadata: metadata,
                        totalTables: totalTables,
                        totalTextLength: totalTextLength,
                        updatedAt: new Date()
                    }
                });
            }
            else {
                await prisma.rawExtractionData.create({
                    data: {
                        fileId: fileId,
                        projectId: projectId,
                        extractionMethods: extractionMethods,
                        textContent: textContent,
                        tablesData: tables,
                        rawResults: rawResults,
                        confidenceScores: confidenceScores,
                        metadata: metadata,
                        totalTables: totalTables,
                        totalTextLength: totalTextLength
                    }
                });
            }
            logger_1.default.info(`✅ Raw extraction data saved successfully`, {
                fileId,
                methodsUsed: extractionMethods.length,
                tablesFound: totalTables,
                textLength: totalTextLength
            });
        }
        catch (error) {
            logger_1.default.error(`❌ Failed to save raw extraction data for file ${fileId}:`, error);
        }
    },
    async getRawExtractionData(fileId) {
        try {
            const rawData = await prisma.rawExtractionData.findFirst({
                where: { fileId: fileId },
                include: {
                    file: {
                        select: { filename: true }
                    }
                }
            });
            return rawData;
        }
        catch (error) {
            logger_1.default.error(`Error getting raw extraction data for file ${fileId}:`, error);
            throw error;
        }
    },
    async checkAIServiceHealth() {
        const startTime = Date.now();
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(`${AI_SERVICE_URL}/api/health`, {
                method: 'GET',
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            const responseTime = Date.now() - startTime;
            if (response.ok) {
                const data = await response.json();
                return {
                    available: true,
                    status: data.status || 'healthy',
                    responseTime
                };
            }
            else {
                return {
                    available: false,
                    status: `HTTP ${response.status}`,
                    responseTime
                };
            }
        }
        catch (error) {
            return {
                available: false,
                status: error.message || 'unreachable',
                responseTime: Date.now() - startTime
            };
        }
    },
    async createProcessingLog(fileId, level, message, method, metadata) {
        try {
            const file = await prisma.projectFile.findUnique({
                where: { id: fileId },
                select: { projectId: true }
            });
            if (!file) {
                logger_1.default.error(`Cannot create processing log: File ${fileId} not found`);
                return;
            }
            const createData = {
                fileId: fileId,
                projectId: file.projectId,
                level: level,
                message: message,
                method: method || null
            };
            if (metadata) {
                createData.metadata = metadata;
            }
            await prisma.aIProcessingLog.create({
                data: createData
            });
        }
        catch (error) {
            logger_1.default.error(`Failed to create processing log:`, error);
        }
    }
};
//# sourceMappingURL=documentProcessor.js.map