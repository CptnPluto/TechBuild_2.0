"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.errorHandler = void 0;
const zod_1 = require("zod");
const logger_1 = __importDefault(require("@/utils/logger"));
const errorHandler = (error, req, res, next) => {
    logger_1.default.error('Error occurred:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });
    if (error instanceof zod_1.ZodError) {
        return res.status(400).json({
            error: 'Validation error',
            details: error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }))
        });
    }
    if (error.statusCode) {
        return res.status(error.statusCode).json({
            error: error.message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    }
    return res.status(500).json({
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && {
            message: error.message,
            stack: error.stack
        })
    });
};
exports.errorHandler = errorHandler;
const createError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
exports.createError = createError;
//# sourceMappingURL=errorHandler.js.map