"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileService = void 0;
const client_1 = require("@prisma/client");
const errorHandler_1 = require("@/middleware/errorHandler");
const logger_1 = __importDefault(require("@/utils/logger"));
const cache_1 = require("@/utils/cache");
const minio_1 = require("@/config/minio");
const path_1 = __importDefault(require("path"));
const prisma = new client_1.PrismaClient();
exports.fileService = {
    async uploadFiles(projectId, files, fileType) {
        try {
            logger_1.default.info(`Uploading ${files.length} files for project ${projectId}`);
            const project = await prisma.project.findUnique({
                where: { id: projectId }
            });
            if (!project) {
                throw (0, errorHandler_1.createError)('Project not found', 404);
            }
            const uploadedFiles = [];
            for (const file of files) {
                const fileExtension = path_1.default.extname(file.originalname);
                const uniqueFileName = `${projectId}/${fileType}/${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
                const uploadResult = await (0, minio_1.uploadFile)(uniqueFileName, file.buffer, file.mimetype, {
                    'Original-Name': file.originalname,
                    'Project-Id': projectId,
                    'File-Type': fileType
                });
                const fileRecord = await prisma.projectFile.create({
                    data: {
                        projectId,
                        filename: file.originalname,
                        fileType,
                        filePath: uploadResult.objectName,
                        fileSize: uploadResult.size,
                        processingStatus: 'uploaded'
                    }
                });
                uploadedFiles.push(fileRecord);
                logger_1.default.info(`Uploaded file: ${file.originalname} -> ${uploadResult.objectName}`);
            }
            await cache_1.cache.del(cache_1.cacheKeys.files.byProject(projectId));
            await cache_1.cache.del(cache_1.cacheKeys.projects.all);
            await cache_1.cache.del(cache_1.cacheKeys.projects.byId(projectId));
            return uploadedFiles;
        }
        catch (error) {
            logger_1.default.error('Error uploading files:', error);
            if (error.statusCode) {
                throw error;
            }
            throw (0, errorHandler_1.createError)('Failed to upload files', 500);
        }
    },
    async getProjectFiles(projectId) {
        try {
            const cacheKey = cache_1.cacheKeys.files.byProject(projectId);
            const cachedFiles = await cache_1.cache.get(cacheKey);
            if (cachedFiles) {
                logger_1.default.info(`Returning cached files for project: ${projectId}`);
                return cachedFiles;
            }
            logger_1.default.info(`Fetching files for project: ${projectId}`);
            const files = await prisma.projectFile.findMany({
                where: { projectId },
                orderBy: { createdAt: 'desc' }
            });
            await cache_1.cache.set(cacheKey, files, cache_1.cacheTTL.files);
            return files;
        }
        catch (error) {
            logger_1.default.error(`Error fetching files for project ${projectId}:`, error);
            throw (0, errorHandler_1.createError)('Failed to fetch project files', 500);
        }
    },
    async getFileById(id) {
        try {
            logger_1.default.info(`Fetching file: ${id}`);
            const file = await prisma.projectFile.findUnique({
                where: { id },
                include: {
                    project: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });
            return file;
        }
        catch (error) {
            logger_1.default.error(`Error fetching file ${id}:`, error);
            throw (0, errorHandler_1.createError)('Failed to fetch file', 500);
        }
    },
    async downloadFile(id) {
        try {
            logger_1.default.info(`Downloading file: ${id}`);
            const file = await prisma.projectFile.findUnique({
                where: { id }
            });
            if (!file) {
                return { file: null, buffer: null };
            }
            const buffer = await (0, minio_1.downloadFile)(file.filePath);
            return { file, buffer };
        }
        catch (error) {
            logger_1.default.error(`Error downloading file ${id}:`, error);
            throw (0, errorHandler_1.createError)('Failed to download file', 500);
        }
    },
    async deleteFile(id) {
        try {
            logger_1.default.info(`Deleting file: ${id}`);
            const file = await prisma.projectFile.findUnique({
                where: { id }
            });
            if (!file) {
                return false;
            }
            await (0, minio_1.deleteFile)(file.filePath);
            await prisma.projectFile.delete({
                where: { id }
            });
            await cache_1.cache.del(cache_1.cacheKeys.files.byProject(file.projectId));
            await cache_1.cache.del(cache_1.cacheKeys.projects.all);
            await cache_1.cache.del(cache_1.cacheKeys.projects.byId(file.projectId));
            logger_1.default.info(`Deleted file: ${file.filename}`);
            return true;
        }
        catch (error) {
            if (error.code === 'P2025') {
                return false;
            }
            logger_1.default.error(`Error deleting file ${id}:`, error);
            throw (0, errorHandler_1.createError)('Failed to delete file', 500);
        }
    },
    async getDownloadUrl(id) {
        try {
            logger_1.default.info(`Getting download URL for file: ${id}`);
            const file = await prisma.projectFile.findUnique({
                where: { id }
            });
            if (!file) {
                return null;
            }
            const downloadUrl = await (0, minio_1.generateDownloadUrl)(file.filePath);
            return {
                file,
                downloadUrl
            };
        }
        catch (error) {
            logger_1.default.error(`Error getting download URL for file ${id}:`, error);
            throw (0, errorHandler_1.createError)('Failed to get download URL', 500);
        }
    },
    async updateProcessingStatus(id, status, data) {
        try {
            logger_1.default.info(`Updating file processing status: ${id} -> ${status}`);
            const file = await prisma.projectFile.update({
                where: { id },
                data: {
                    processingStatus: status,
                    ...(data && { processedData: data })
                }
            });
            return file;
        }
        catch (error) {
            logger_1.default.error(`Error updating file processing status ${id}:`, error);
            throw (0, errorHandler_1.createError)('Failed to update file status', 500);
        }
    },
    async getFileStats() {
        try {
            const [totalFiles, processingFiles, completedFiles, failedFiles] = await Promise.all([
                prisma.projectFile.count(),
                prisma.projectFile.count({ where: { processingStatus: 'processing' } }),
                prisma.projectFile.count({ where: { processingStatus: 'completed' } }),
                prisma.projectFile.count({ where: { processingStatus: 'failed' } })
            ]);
            return {
                totalFiles,
                processingFiles,
                completedFiles,
                failedFiles
            };
        }
        catch (error) {
            logger_1.default.error('Error fetching file stats:', error);
            throw (0, errorHandler_1.createError)('Failed to fetch file statistics', 500);
        }
    },
    async updateParsedData(id, data) {
        try {
            logger_1.default.info(`Updating parsed data for file: ${id}`);
            const existingFile = await prisma.projectFile.findUnique({
                where: { id }
            });
            if (!existingFile) {
                throw (0, errorHandler_1.createError)('File not found', 404);
            }
            const updatedFile = await prisma.projectFile.update({
                where: { id },
                data: {
                    processedData: JSON.stringify(data),
                    updatedAt: new Date()
                },
                include: {
                    project: true
                }
            });
            if (existingFile.projectId) {
                cache_1.cache.del(cache_1.cacheKeys.files.byProject(existingFile.projectId));
            }
            logger_1.default.info(`Successfully updated parsed data for file: ${id}`);
            return updatedFile;
        }
        catch (error) {
            logger_1.default.error(`Error updating parsed data for file ${id}:`, error);
            if (error && typeof error === 'object' && 'statusCode' in error) {
                throw error;
            }
            throw (0, errorHandler_1.createError)('Failed to update parsed data', 500);
        }
    }
};
//# sourceMappingURL=files.js.map