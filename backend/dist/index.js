"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const errorHandler_1 = require("@/middleware/errorHandler");
const requestLogger_1 = require("@/middleware/requestLogger");
const projects_1 = __importDefault(require("@/routes/projects"));
const files_1 = __importDefault(require("@/routes/files"));
const ai_1 = __importDefault(require("@/routes/ai"));
const logs_1 = __importDefault(require("@/routes/logs"));
const logger_1 = __importDefault(require("@/utils/logger"));
const minio_1 = require("@/config/minio");
dotenv_1.default.config({ path: '../.env' });
const app = (0, express_1.default)();
const PORT = process.env.BACKEND_PORT || 8080;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use(requestLogger_1.requestLogger);
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'techbuild-backend',
        version: process.env.npm_package_version || '1.0.0'
    });
});
app.use('/api/projects', projects_1.default);
app.use('/api/files', files_1.default);
app.use('/api/ai', ai_1.default);
app.use('/api/logs', logs_1.default);
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
});
app.use(errorHandler_1.errorHandler);
async function startServer() {
    try {
        await (0, minio_1.initializeMinIO)();
        app.listen(PORT, () => {
            logger_1.default.info(`🚀 TechBuild Backend running on port ${PORT}`);
            logger_1.default.info(`📊 Health check: http://localhost:${PORT}/health`);
            logger_1.default.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    }
    catch (error) {
        logger_1.default.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
exports.default = app;
//# sourceMappingURL=index.js.map