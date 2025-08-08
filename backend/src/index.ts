import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { errorHandler } from '@/middleware/errorHandler';
import { requestLogger } from '@/middleware/requestLogger';
import projectsRouter from '@/routes/projects';
import filesRouter from '@/routes/files';
import aiRouter from '@/routes/ai';
import logsRouter from '@/routes/logs';
import logger from '@/utils/logger';
import { initializeMinIO } from '@/config/minio';

// Load environment variables
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.BACKEND_PORT || 8080;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Custom request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'techbuild-backend',
    version: process.env.npm_package_version || '2.0.0'
  });
});

// API routes
app.use('/api/projects', projectsRouter);
app.use('/api/files', filesRouter);
app.use('/api/ai', aiRouter);
app.use('/api/logs', logsRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Initialize MinIO storage
    await initializeMinIO();
    
    app.listen(PORT, () => {
      logger.info(`🚀 TechBuild Backend running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;