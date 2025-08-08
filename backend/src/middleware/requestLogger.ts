import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '@/utils/logger';

// Extend Request interface to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  const startTime = Date.now();
  
  // Attach to request object
  req.requestId = requestId;
  req.startTime = startTime;

  // Log request start
  logger.info('HTTP Request Started', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length')
  });

  // Override res.end to log response
  const originalEnd = res.end;
  
  res.end = function(this: Response, chunk?: any, encoding?: any) {
    const responseTime = Date.now() - startTime;
    
    // Log response
    logger.info('HTTP Request Completed', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('Content-Length') || 0
    });

    // Call original end
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};