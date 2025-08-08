import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { z } from 'zod';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger from '@/utils/logger';
import { createError } from '@/middleware/errorHandler';
import { uploadFile, getFileUrl } from '@/config/minio';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow PDF files only
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed') as any, false);
    }
  },
});

// Validation schemas
const uploadSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  description: z.string().optional()
});

// Get all files for a project
router.get('/project/:projectId', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    logger.info(`📁 Fetching files for project: ${projectId}`);

    const files = await prisma.projectFile.findMany({
      where: { projectId },
      include: {
        _count: {
          select: {
            processingJobs: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: files,
      count: files.length
    });
  } catch (error) {
    next(error);
  }
});

// Get file by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info(`📁 Fetching file: ${id}`);

    const file = await prisma.projectFile.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true }
        },
        processingJobs: {
          orderBy: {
            startedAt: 'desc'
          },
          take: 10
        }
      }
    });

    if (!file) {
      throw createError('File not found', 404);
    }

    res.json({
      success: true,
      data: file
    });
  } catch (error) {
    next(error);
  }
});

// Upload file
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw createError('No file uploaded', 400);
    }

    const { projectId, description } = uploadSchema.parse(req.body);
    logger.info(`📁 Uploading file for project: ${projectId}`);

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      throw createError('Project not found', 404);
    }

    // Generate unique filename
    const fileExtension = path.extname(req.file.originalname);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const bucketName = process.env.MINIO_BUCKET_NAME || 'techbuild-documents';
    const objectName = `projects/${projectId}/${uniqueFilename}`;

    // Upload to MinIO
    const fileBuffer = req.file.buffer;
    const fileStream = require('stream').Readable.from(fileBuffer);
    
    await uploadFile(bucketName, objectName, fileStream, req.file.size, {
      'Content-Type': req.file.mimetype,
      'Original-Name': req.file.originalname
    });

    // Save to database
    const file = await prisma.projectFile.create({
      data: {
        filename: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        filePath: objectName,
        projectId,
        description,
        processingStatus: 'pending',
        uploadedAt: new Date()
      }
    });

    const fileUrl = getFileUrl(bucketName, objectName);

    res.status(201).json({
      success: true,
      data: {
        ...file,
        url: fileUrl
      },
      message: 'File uploaded successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Delete file
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info(`📁 Deleting file: ${id}`);

    // Get file details for MinIO cleanup
    const file = await prisma.projectFile.findUnique({
      where: { id }
    });

    if (!file) {
      throw createError('File not found', 404);
    }

    // TODO: Delete from MinIO
    // await deleteFile(bucketName, file.filePath);

    // Delete from database
    await prisma.projectFile.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      next(createError('File not found', 404));
    } else {
      next(error);
    }
  }
});

// Update file metadata
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    logger.info(`📁 Updating file: ${id}`);

    const file = await prisma.projectFile.update({
      where: { id },
      data: { description }
    });

    res.json({
      success: true,
      data: file,
      message: 'File updated successfully'
    });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      next(createError('File not found', 404));
    } else {
      next(error);
    }
  }
});

export default router;