"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("@/utils/logger"));
const loggingService_1 = __importDefault(require("@/services/loggingService"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const getLogsSchema = zod_1.z.object({
    fileId: zod_1.z.string().uuid().optional(),
    projectId: zod_1.z.string().uuid().optional(),
    level: zod_1.z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']).optional(),
    method: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().min(1).max(1000).default(100),
    offset: zod_1.z.coerce.number().min(0).default(0),
    since: zod_1.z.string().datetime().optional()
});
router.get('/', async (req, res, next) => {
    try {
        const query = getLogsSchema.parse(req.query);
        logger_1.default.info('Fetching AI processing logs', query);
        const where = {};
        if (query.fileId) {
            where.fileId = query.fileId;
        }
        if (query.projectId) {
            where.projectId = query.projectId;
        }
        if (query.level) {
            where.level = query.level;
        }
        if (query.method) {
            where.method = query.method;
        }
        if (query.since) {
            where.timestamp = {
                gte: new Date(query.since)
            };
        }
        const logs = await prisma.aIProcessingLog.findMany({
            where,
            include: {
                job: {
                    select: {
                        id: true,
                        provider: true,
                        jobType: true,
                        status: true,
                        confidence: true
                    }
                }
            },
            orderBy: {
                timestamp: 'desc'
            },
            take: query.limit,
            skip: query.offset
        });
        const totalCount = await prisma.aIProcessingLog.count({ where });
        return res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    total: totalCount,
                    limit: query.limit,
                    offset: query.offset,
                    hasMore: query.offset + query.limit < totalCount
                }
            }
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
router.get('/project/:projectId', async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const query = getLogsSchema.omit({ projectId: true }).parse(req.query);
        logger_1.default.info(`Fetching logs for project: ${projectId}`);
        const where = { projectId };
        if (query.level)
            where.level = query.level;
        if (query.method)
            where.method = query.method;
        if (query.since)
            where.timestamp = { gte: new Date(query.since) };
        const logs = await prisma.aIProcessingLog.findMany({
            where,
            include: {
                job: {
                    select: {
                        id: true,
                        provider: true,
                        jobType: true,
                        status: true,
                        confidence: true,
                        fileId: true
                    }
                }
            },
            orderBy: {
                timestamp: 'desc'
            },
            take: query.limit,
            skip: query.offset
        });
        const totalCount = await prisma.aIProcessingLog.count({ where });
        const files = await prisma.projectFile.findMany({
            where: { projectId },
            select: {
                id: true,
                filename: true,
                fileType: true,
                processingStatus: true,
                confidence: true
            }
        });
        return res.json({
            success: true,
            data: {
                logs,
                files,
                pagination: {
                    total: totalCount,
                    limit: query.limit,
                    offset: query.offset,
                    hasMore: query.offset + query.limit < totalCount
                }
            }
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
router.get('/file/:fileId', async (req, res, next) => {
    try {
        const { fileId } = req.params;
        const query = getLogsSchema.omit({ fileId: true }).parse(req.query);
        logger_1.default.info(`Fetching logs for file: ${fileId}`);
        const where = { fileId };
        if (query.level)
            where.level = query.level;
        if (query.method)
            where.method = query.method;
        if (query.since)
            where.timestamp = { gte: new Date(query.since) };
        const logs = await prisma.aIProcessingLog.findMany({
            where,
            include: {
                job: {
                    select: {
                        id: true,
                        provider: true,
                        jobType: true,
                        status: true,
                        confidence: true
                    }
                }
            },
            orderBy: {
                timestamp: 'desc'
            },
            take: query.limit,
            skip: query.offset
        });
        const totalCount = await prisma.aIProcessingLog.count({ where });
        const file = await prisma.projectFile.findUnique({
            where: { id: fileId },
            select: {
                id: true,
                filename: true,
                fileType: true,
                processingStatus: true,
                confidence: true,
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        return res.json({
            success: true,
            data: {
                logs,
                file,
                pagination: {
                    total: totalCount,
                    limit: query.limit,
                    offset: query.offset,
                    hasMore: query.offset + query.limit < totalCount
                }
            }
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
router.get('/methods', async (req, res, next) => {
    try {
        logger_1.default.info('Fetching available extraction methods');
        const methods = await prisma.aIProcessingLog.groupBy({
            by: ['method'],
            where: {
                method: {
                    not: null
                }
            },
            _count: {
                method: true
            },
            orderBy: {
                _count: {
                    method: 'desc'
                }
            }
        });
        const methodStats = methods.map(m => ({
            method: m.method,
            count: m._count.method
        }));
        return res.json({
            success: true,
            data: methodStats
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
router.post('/', async (req, res, next) => {
    try {
        const logData = zod_1.z.object({
            jobId: zod_1.z.string().uuid().optional(),
            fileId: zod_1.z.string().uuid(),
            projectId: zod_1.z.string().uuid(),
            level: zod_1.z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']),
            message: zod_1.z.string(),
            method: zod_1.z.string().optional(),
            metadata: zod_1.z.record(zod_1.z.any()).optional()
        }).parse(req.body);
        logger_1.default.info('Creating processing log entry', { fileId: logData.fileId, level: logData.level });
        const createData = {
            fileId: logData.fileId,
            projectId: logData.projectId,
            level: logData.level,
            message: logData.message,
            jobId: logData.jobId || null,
            method: logData.method || null
        };
        if (logData.metadata) {
            createData.metadata = logData.metadata;
        }
        const log = await prisma.aIProcessingLog.create({
            data: createData,
            include: {
                job: true
            }
        });
        return res.status(201).json({
            success: true,
            data: log
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
router.get('/stats', async (req, res, next) => {
    try {
        const { projectId, fileId } = req.query;
        logger_1.default.info('Fetching log statistics', { projectId, fileId });
        const where = {};
        if (projectId)
            where.projectId = projectId;
        if (fileId)
            where.fileId = fileId;
        const levelStats = await prisma.aIProcessingLog.groupBy({
            where,
            by: ['level'],
            _count: {
                level: true
            }
        });
        const methodStats = await prisma.aIProcessingLog.groupBy({
            where: {
                ...where,
                method: { not: null }
            },
            by: ['method'],
            _count: {
                method: true
            }
        });
        const recentActivity = await prisma.aIProcessingLog.count({
            where: {
                ...where,
                timestamp: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            }
        });
        return res.json({
            success: true,
            data: {
                levelDistribution: levelStats.map(s => ({
                    level: s.level,
                    count: s._count.level
                })),
                methodDistribution: methodStats.map(s => ({
                    method: s.method,
                    count: s._count.method
                })),
                recentActivity24h: recentActivity
            }
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
router.post('/simulate/:fileId', async (req, res, next) => {
    try {
        const { fileId } = req.params;
        const file = await prisma.projectFile.findUnique({
            where: { id: fileId },
            include: {
                project: {
                    select: { id: true, name: true }
                }
            }
        });
        if (!file) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }
        logger_1.default.info(`Creating sample logs for file: ${fileId}`);
        await loggingService_1.default.simulateProcessingLogs(fileId, file.project.id, file.filename);
        return res.json({
            success: true,
            message: 'Sample processing logs created successfully'
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
exports.default = router;
//# sourceMappingURL=logs.js.map