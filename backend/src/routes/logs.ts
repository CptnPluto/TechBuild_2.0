import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '@/utils/logger';
import { createError } from '@/middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// Get logs for a project
router.get('/project/:projectId', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { limit = 100, offset = 0, level } = req.query;
    
    logger.info(`📝 Fetching logs for project: ${projectId}`);

    const where: any = { projectId };
    if (level) {
      where.level = level;
    }

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: {
        timestamp: 'desc'
      },
      take: Number(limit),
      skip: Number(offset)
    });

    const total = await prisma.activityLog.count({ where });

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + logs.length < total
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get logs for a file
router.get('/file/:fileId', async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    
    logger.info(`📝 Fetching logs for file: ${fileId}`);

    const logs = await prisma.activityLog.findMany({
      where: { fileId },
      orderBy: {
        timestamp: 'desc'
      },
      take: Number(limit),
      skip: Number(offset)
    });

    const total = await prisma.activityLog.count({ 
      where: { fileId } 
    });

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + logs.length < total
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get logs for a processing job
router.get('/job/:jobId', async (req, res, next) => {
  try {
    const { jobId } = req.params;
    logger.info(`📝 Fetching logs for job: ${jobId}`);

    const logs = await prisma.activityLog.findMany({
      where: { jobId },
      orderBy: {
        timestamp: 'desc'
      }
    });

    res.json({
      success: true,
      data: logs,
      count: logs.length
    });
  } catch (error) {
    next(error);
  }
});

// Create log entry (internal use)
router.post('/', async (req, res, next) => {
  try {
    const { 
      level, 
      message, 
      fileId, 
      projectId, 
      jobId, 
      metadata 
    } = req.body;
    
    logger.info('📝 Creating log entry');

    const log = await prisma.activityLog.create({
      data: {
        level: level || 'info',
        message,
        fileId,
        projectId,
        jobId,
        metadata,
        timestamp: new Date()
      }
    });

    res.status(201).json({
      success: true,
      data: log,
      message: 'Log entry created'
    });
  } catch (error) {
    next(error);
  }
});

export default router;