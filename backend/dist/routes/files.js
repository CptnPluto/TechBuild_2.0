"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const files_1 = require("@/services/files");
const documentProcessor_1 = require("@/services/documentProcessor");
const logger_1 = __importDefault(require("@/utils/logger"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024,
        files: 5
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'image/png',
            'image/jpeg',
            'image/jpg',
            'application/zip'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`File type ${file.mimetype} not allowed`));
        }
    }
});
router.post('/upload', upload.array('files', 5), async (req, res, next) => {
    try {
        const { project_id, file_type } = req.body;
        const files = req.files;
        if (!project_id) {
            return res.status(400).json({
                success: false,
                error: 'Project ID is required'
            });
        }
        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No files provided'
            });
        }
        if (!['DS', 'HDW'].includes(file_type)) {
            return res.status(400).json({
                success: false,
                error: 'File type must be DS (Door Schedule) or HDW (Hardware)'
            });
        }
        logger_1.default.info(`🔄 UPLOAD START: Uploading ${files.length} files for project ${project_id}`, {
            fileNames: files.map(f => f.originalname),
            fileType: file_type,
            fileSizes: files.map(f => f.size)
        });
        logger_1.default.info(`🔧 UPLOAD STEP 1: Calling fileService.uploadFiles`);
        const uploadedFiles = await files_1.fileService.uploadFiles(project_id, files, file_type);
        logger_1.default.info(`✅ UPLOAD STEP 1 COMPLETE: Files uploaded`, {
            uploadedCount: uploadedFiles.length,
            fileIds: uploadedFiles.map(f => f.id)
        });
        logger_1.default.info(`🤖 PROCESSING START: Queueing ${uploadedFiles.length} files for AI processing`);
        const processingJobs = await Promise.allSettled(uploadedFiles.map((file, index) => {
            const taskType = file_type === 'DS' ? 'door_schedule' : 'hardware_data';
            logger_1.default.info(`🔄 PROCESSING QUEUE ${index + 1}/${uploadedFiles.length}: File ${file.id} -> ${taskType}`);
            return documentProcessor_1.documentProcessor.queueFileForProcessing(file.id, taskType);
        }));
        const successfulJobs = processingJobs.filter(job => job.status === 'fulfilled').length;
        const failedJobs = processingJobs.filter(job => job.status === 'rejected');
        logger_1.default.info(`📊 PROCESSING RESULTS: ${successfulJobs}/${uploadedFiles.length} files successfully queued`);
        if (failedJobs.length > 0) {
            logger_1.default.error(`❌ PROCESSING FAILURES: ${failedJobs.length} files failed to queue`, {
                failures: failedJobs.map((job, index) => ({
                    fileIndex: index,
                    reason: job.reason?.message || job.reason
                }))
            });
        }
        return res.json({
            success: true,
            data: uploadedFiles,
            message: `Successfully uploaded ${files.length} file(s) and queued ${successfulJobs} for processing`,
            processing: {
                queued: successfulJobs,
                total: uploadedFiles.length
            }
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
router.get('/project/:projectId', async (req, res, next) => {
    try {
        const { projectId } = req.params;
        logger_1.default.info(`Fetching files for project: ${projectId}`);
        const files = await files_1.fileService.getProjectFiles(projectId);
        return res.json({
            success: true,
            data: files,
            count: Array.isArray(files) ? files.length : 0
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        logger_1.default.info(`Fetching file: ${id}`);
        const file = await files_1.fileService.getFileById(id);
        if (!file) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }
        return res.json({
            success: true,
            data: file
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
router.get('/:id/download-url', async (req, res, next) => {
    try {
        const { id } = req.params;
        logger_1.default.info(`Getting download URL for file: ${id}`);
        const result = await files_1.fileService.getDownloadUrl(id);
        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }
        return res.json({
            success: true,
            data: {
                file: result.file,
                downloadUrl: result.downloadUrl,
                expiresIn: 3600
            }
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
router.get('/:id/download', async (req, res, next) => {
    try {
        const { id } = req.params;
        logger_1.default.info(`Downloading file: ${id}`);
        const { file, buffer } = await files_1.fileService.downloadFile(id);
        if (!file || !buffer) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }
        res.set({
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename=\"${file.filename}\"`,
            'Content-Length': buffer.length
        });
        return res.send(buffer);
    }
    catch (error) {
        next(error);
        return;
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        logger_1.default.info(`Deleting file: ${id}`);
        const success = await files_1.fileService.deleteFile(id);
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }
        return res.json({
            success: true,
            message: 'File deleted successfully'
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
router.post('/:id/process', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { task_type = 'door_schedule' } = req.body;
        logger_1.default.info(`Manually triggering processing for file: ${id}`);
        const job = await documentProcessor_1.documentProcessor.queueFileForProcessing(id, task_type);
        return res.json({
            success: true,
            data: job,
            message: 'File queued for processing'
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
router.get('/:id/status', async (req, res, next) => {
    try {
        const { id } = req.params;
        logger_1.default.info(`Getting processing status for file: ${id}`);
        const status = await documentProcessor_1.documentProcessor.getProcessingStatus(id);
        return res.json({
            success: true,
            data: status
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
router.get('/project/:projectId/results', async (req, res, next) => {
    try {
        const { projectId } = req.params;
        logger_1.default.info(`Getting processed results for project: ${projectId}`);
        const results = await documentProcessor_1.documentProcessor.getProjectResults(projectId);
        return res.json({
            success: true,
            data: results,
            count: Array.isArray(results) ? results.length : 0
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
router.get('/ai-service/health', async (_req, res, next) => {
    try {
        logger_1.default.info('Checking AI service health');
        const health = await documentProcessor_1.documentProcessor.checkAIServiceHealth();
        return res.json({
            success: true,
            data: health
        });
    }
    catch (error) {
        next(error);
        return;
    }
});
router.put('/:id/parsed-data', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { data } = req.body;
        logger_1.default.info(`Updating parsed data for file: ${id}`);
        if (!data) {
            return res.status(400).json({
                success: false,
                error: 'Parsed data is required'
            });
        }
        const updatedFile = await files_1.fileService.updateParsedData(id, data);
        return res.json({
            success: true,
            data: updatedFile
        });
    }
    catch (error) {
        logger_1.default.error(`Error updating parsed data for file ${req.params.id}:`, error);
        next(error);
        return;
    }
});
router.get('/:id/raw-extraction-data', async (req, res, next) => {
    try {
        const { id } = req.params;
        logger_1.default.info(`Getting raw extraction data for file: ${id}`);
        const rawData = await documentProcessor_1.documentProcessor.getRawExtractionData(id);
        if (!rawData) {
            return res.status(404).json({
                success: false,
                error: 'Raw extraction data not found for this file'
            });
        }
        return res.json({
            success: true,
            data: rawData
        });
    }
    catch (error) {
        logger_1.default.error(`Error getting raw extraction data for file ${req.params.id}:`, error);
        next(error);
        return;
    }
});
exports.default = router;
//# sourceMappingURL=files.js.map