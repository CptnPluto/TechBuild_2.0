"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("@/utils/logger"));
const prisma = new client_1.PrismaClient();
class LoggingService {
    static async log(data) {
        try {
            const createData = {
                fileId: data.fileId,
                projectId: data.projectId,
                level: data.level,
                message: data.message,
                jobId: data.jobId || null,
                method: data.method || null,
                timestamp: new Date()
            };
            if (data.metadata) {
                createData.metadata = data.metadata;
            }
            await prisma.aIProcessingLog.create({
                data: createData
            });
        }
        catch (error) {
            logger_1.default.error('Failed to create processing log:', error);
        }
    }
    static async info(fileId, projectId, message, method, metadata, jobId) {
        return this.log({
            jobId: jobId || null,
            fileId,
            projectId,
            level: 'INFO',
            message,
            method: method || null,
            metadata: metadata || null
        });
    }
    static async warn(fileId, projectId, message, method, metadata, jobId) {
        return this.log({
            jobId: jobId || null,
            fileId,
            projectId,
            level: 'WARN',
            message,
            method: method || null,
            metadata: metadata || null
        });
    }
    static async error(fileId, projectId, message, method, metadata, jobId) {
        return this.log({
            jobId: jobId || null,
            fileId,
            projectId,
            level: 'ERROR',
            message,
            method: method || null,
            metadata: metadata || null
        });
    }
    static async debug(fileId, projectId, message, method, metadata, jobId) {
        return this.log({
            jobId: jobId || null,
            fileId,
            projectId,
            level: 'DEBUG',
            message,
            method: method || null,
            metadata: metadata || null
        });
    }
    static async parseAndStoreAILog(aiLogEntry, fileId, projectId, jobId) {
        try {
            const logPattern = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) - ([^-]+) - (INFO|WARN|ERROR|DEBUG) - (.+)/;
            const match = aiLogEntry.match(logPattern);
            if (!match) {
                logger_1.default.warn('Could not parse AI log entry:', aiLogEntry);
                return;
            }
            const [, timestamp, module, level, message] = match;
            let method = null;
            if (module && module.includes('enhanced_pdf_processor')) {
                if (message && message.includes('pdfplumber'))
                    method = 'pdfplumber';
                else if (message && (message.includes('tabula') || message.includes('Tabula')))
                    method = 'tabula';
                else if (message && (message.includes('camelot') || message.includes('Camelot')))
                    method = 'camelot';
                else if (message && (message.includes('ocr_fallback') || message.includes('OCR')))
                    method = 'ocr_fallback';
                else if (message && (message.includes('pymupdf') || message.includes('PyMuPDF')))
                    method = 'pymupdf';
            }
            let metadata = null;
            const tableMatch = message ? message.match(/(\d+) tables? found/) : null;
            if (tableMatch) {
                metadata = { ...(metadata || {}), tablesFound: parseInt(tableMatch[1]) };
            }
            const confidenceMatch = message ? message.match(/confidence[:\s]+(\d+(?:\.\d+)?)/i) : null;
            if (confidenceMatch) {
                metadata = { ...(metadata || {}), confidence: parseFloat(confidenceMatch[1]) };
            }
            await this.log({
                jobId: jobId || null,
                fileId,
                projectId,
                level: level,
                message: this.cleanLogMessage(message || ''),
                method,
                metadata
            });
        }
        catch (error) {
            logger_1.default.error('Failed to parse and store AI log:', error);
        }
    }
    static cleanLogMessage(message) {
        return message
            .replace(/^(✅|❌|⚠️|📊|🎯|📋|📄|🔍)\s*/, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    static async logExtractionSummary(fileId, projectId, jobId, methodResults) {
        try {
            await this.info(fileId, projectId, 'Starting comprehensive PDF extraction', undefined, { totalMethods: methodResults.length }, jobId);
            for (const result of methodResults) {
                if (result.success) {
                    await this.info(fileId, projectId, `${result.method} extraction successful - ${result.tablesFound} tables found`, result.method, {
                        tablesFound: result.tablesFound,
                        confidence: result.confidence,
                        extractionSuccess: true
                    }, jobId);
                }
                else {
                    await this.error(fileId, projectId, `${result.method} extraction failed: ${result.error || 'Unknown error'}`, result.method, {
                        extractionSuccess: false,
                        error: result.error
                    }, jobId);
                }
            }
            const successfulMethods = methodResults.filter(r => r.success);
            const totalTables = successfulMethods.reduce((sum, r) => sum + r.tablesFound, 0);
            await this.info(fileId, projectId, `Comprehensive extraction complete: ${successfulMethods.length} methods used, ${totalTables} total tables found`, undefined, {
                methodsUsed: successfulMethods.length,
                totalMethods: methodResults.length,
                totalTablesFound: totalTables,
                successfulMethods: successfulMethods.map(r => r.method),
                methodAttribution: successfulMethods.map(r => ({
                    method: r.method,
                    tablesFound: r.tablesFound,
                    confidence: r.confidence
                }))
            }, jobId);
        }
        catch (error) {
            logger_1.default.error('Failed to log extraction summary:', error);
        }
    }
    static async simulateProcessingLogs(fileId, projectId, filename) {
        try {
            const file = await prisma.projectFile.findUnique({
                where: { id: fileId },
                include: { project: true }
            });
            if (!file) {
                logger_1.default.warn(`File ${fileId} not found for log simulation`);
                return;
            }
            const jobId = `sim-${Date.now()}`;
            const processingSteps = [
                {
                    level: 'INFO',
                    message: `Starting comprehensive PDF extraction for ${filename}`,
                    method: undefined,
                    metadata: { filename, fileSize: file.fileSize }
                },
                {
                    level: 'INFO',
                    message: 'Trying extraction method: pdfplumber',
                    method: 'pdfplumber',
                    metadata: undefined
                },
                {
                    level: 'INFO',
                    message: 'pdfplumber extraction successful - 15 tables found',
                    method: 'pdfplumber',
                    metadata: { tablesFound: 15, confidence: 0.85 }
                },
                {
                    level: 'INFO',
                    message: 'Trying extraction method: tabula',
                    method: 'tabula',
                    metadata: undefined
                },
                {
                    level: 'INFO',
                    message: 'Robust Tabula extraction successful: 3 tables found',
                    method: 'tabula',
                    metadata: { tablesFound: 3, confidence: 0.92 }
                },
                {
                    level: 'INFO',
                    message: 'Trying extraction method: ocr_fallback',
                    method: 'ocr_fallback',
                    metadata: undefined
                },
                {
                    level: 'INFO',
                    message: 'ocr_fallback extraction successful - 0 tables found',
                    method: 'ocr_fallback',
                    metadata: { tablesFound: 0, confidence: 0.45 }
                },
                {
                    level: 'INFO',
                    message: 'METHOD ATTRIBUTION SUMMARY: pdfplumber: 15 extracted → 15 final, tabula: 3 extracted → 3 final',
                    method: undefined,
                    metadata: {
                        methodAttribution: {
                            pdfplumber: { extracted: 15, final: 15 },
                            tabula: { extracted: 3, final: 3 }
                        }
                    }
                },
                {
                    level: 'INFO',
                    message: 'Comprehensive extraction complete: 4 methods used, 18 total tables found, text length: 22072 characters',
                    method: undefined,
                    metadata: {
                        methodsUsed: 4,
                        totalTablesFound: 18,
                        textLength: 22072,
                        processingComplete: true
                    }
                }
            ];
            for (let i = 0; i < processingSteps.length; i++) {
                const step = processingSteps[i];
                if (!step)
                    continue;
                await this.log({
                    jobId,
                    fileId,
                    projectId,
                    level: step.level,
                    message: step.message,
                    method: step.method || null,
                    metadata: step.metadata || null
                });
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            logger_1.default.info(`Created ${processingSteps.length} simulated log entries for file ${fileId}`);
        }
        catch (error) {
            logger_1.default.error('Failed to simulate processing logs:', error);
        }
    }
    static async cleanupOldLogs(daysToKeep = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            const deleted = await prisma.aIProcessingLog.deleteMany({
                where: {
                    timestamp: {
                        lt: cutoffDate
                    }
                }
            });
            logger_1.default.info(`Cleaned up ${deleted.count} old processing logs older than ${daysToKeep} days`);
        }
        catch (error) {
            logger_1.default.error('Failed to cleanup old logs:', error);
        }
    }
}
exports.LoggingService = LoggingService;
exports.default = LoggingService;
//# sourceMappingURL=loggingService.js.map