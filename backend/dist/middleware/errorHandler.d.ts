import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}
export declare const errorHandler: (error: AppError | ZodError, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const createError: (message: string, statusCode: number) => AppError;
//# sourceMappingURL=errorHandler.d.ts.map