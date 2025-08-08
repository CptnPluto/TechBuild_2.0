import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import logger from '@/utils/logger';
import { createError } from '@/middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  client: z.string().optional(),
  location: z.string().optional()
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  client: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(['active', 'completed', 'archived']).optional()
});

// Get all projects
router.get('/', async (req, res, next) => {
  try {
    logger.info('📊 Fetching all projects');
    
    const projects = await prisma.project.findMany({
      include: {
        _count: {
          select: {
            files: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: projects,
      count: projects.length
    });
  } catch (error) {
    next(error);
  }
});

// Get project by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info(`📊 Fetching project: ${id}`);

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        files: {
          include: {
            _count: {
              select: {
                processingJobs: true
              }
            }
          }
        },
        _count: {
          select: {
            files: true
          }
        }
      }
    });

    if (!project) {
      throw createError('Project not found', 404);
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
});

// Create new project
router.post('/', async (req, res, next) => {
  try {
    const validatedData = createProjectSchema.parse(req.body);
    logger.info('📊 Creating new project:', validatedData);

    const project = await prisma.project.create({
      data: {
        ...validatedData,
        status: 'active'
      }
    });

    res.status(201).json({
      success: true,
      data: project,
      message: 'Project created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Update project
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updateProjectSchema.parse(req.body);
    logger.info(`📊 Updating project: ${id}`, validatedData);

    const project = await prisma.project.update({
      where: { id },
      data: validatedData
    });

    res.json({
      success: true,
      data: project,
      message: 'Project updated successfully'
    });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      next(createError('Project not found', 404));
    } else {
      next(error);
    }
  }
});

// Delete project
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info(`📊 Deleting project: ${id}`);

    await prisma.project.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      next(createError('Project not found', 404));
    } else {
      next(error);
    }
  }
});

export default router;