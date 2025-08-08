import { Request, Response, NextFunction } from 'express';
import logger from '@/utils/logger';

export interface CustomError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

export const createError = (message: string, statusCode: number = 500): CustomError => {
  const error: CustomError = new Error(message);
  error.statusCode = statusCode;
  error.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
  error.isOperational = true;
  return error;
};

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { statusCode = 500, message } = error;

  // Log the error
  logger.error('API Error:', {
    message: error.message,
    statusCode,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource ID';
  }

  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const errorResponse = {
    success: false,
    error: {
      message: isDevelopment ? message : statusCode === 500 ? 'Internal server error' : message,
      status: statusCode,
      ...(isDevelopment && { 
        stack: error.stack,
        details: error 
      })
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  };

  res.status(statusCode).json(errorResponse);
};