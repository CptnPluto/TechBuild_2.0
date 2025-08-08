"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
console.log('✅ Basic imports loaded');
try {
    const { errorHandler } = require('./middleware/errorHandler');
    console.log('✅ errorHandler imported');
}
catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ errorHandler failed:', errorMessage);
}
try {
    const { requestLogger } = require('./middleware/requestLogger');
    console.log('✅ requestLogger imported');
}
catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ requestLogger failed:', errorMessage);
}
try {
    const projectRoutes = require('./routes/projects');
    console.log('✅ projectRoutes imported');
}
catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ projectRoutes failed:', errorMessage);
}
try {
    const fileRoutes = require('./routes/files');
    console.log('✅ fileRoutes imported');
}
catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ fileRoutes failed:', errorMessage);
}
try {
    const aiRoutes = require('./routes/ai');
    console.log('✅ aiRoutes imported');
}
catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ aiRoutes failed:', errorMessage);
}
try {
    const logger = require('./utils/logger');
    console.log('✅ logger imported');
}
catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ logger failed:', errorMessage);
}
console.log('🎉 All imports tested');
process.exit(0);
//# sourceMappingURL=debug.js.map