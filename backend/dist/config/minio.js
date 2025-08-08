"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.minioConfig = exports.BUCKET_NAME = exports.minioClient = void 0;
exports.initializeMinIO = initializeMinIO;
exports.generateUploadUrl = generateUploadUrl;
exports.generateDownloadUrl = generateDownloadUrl;
exports.uploadFile = uploadFile;
exports.downloadFile = downloadFile;
exports.deleteFile = deleteFile;
exports.getFileInfo = getFileInfo;
exports.listFiles = listFiles;
const minio_1 = require("minio");
const logger_1 = __importDefault(require("../utils/logger"));
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'localhost:9000';
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minioadmin';
const MINIO_BUCKET = process.env.MINIO_BUCKET || 'techbuild-dev';
const parseEndpoint = (endpoint) => {
    const cleanEndpoint = endpoint.replace(/^https?:\/\//, '');
    const [host, port] = cleanEndpoint.split(':');
    return {
        endPoint: host || 'localhost',
        port: port ? parseInt(port, 10) : 9000,
        useSSL: endpoint.startsWith('https://')
    };
};
const endpointConfig = parseEndpoint(MINIO_ENDPOINT);
exports.minioClient = new minio_1.Client({
    endPoint: endpointConfig.endPoint,
    port: endpointConfig.port,
    useSSL: endpointConfig.useSSL,
    accessKey: MINIO_ACCESS_KEY,
    secretKey: MINIO_SECRET_KEY,
});
exports.BUCKET_NAME = MINIO_BUCKET;
async function initializeMinIO() {
    try {
        logger_1.default.info('🗄️ Initializing MinIO storage...');
        const bucketExists = await exports.minioClient.bucketExists(exports.BUCKET_NAME);
        if (!bucketExists) {
            logger_1.default.info(`Creating bucket: ${exports.BUCKET_NAME}`);
            await exports.minioClient.makeBucket(exports.BUCKET_NAME, 'us-east-1');
            const policy = {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: { AWS: ['*'] },
                        Action: ['s3:GetObject'],
                        Resource: [`arn:aws:s3:::${exports.BUCKET_NAME}/uploads/*`]
                    }
                ]
            };
            await exports.minioClient.setBucketPolicy(exports.BUCKET_NAME, JSON.stringify(policy));
            logger_1.default.info(`✅ Created bucket ${exports.BUCKET_NAME} with public read policy`);
        }
        else {
            logger_1.default.info(`✅ Bucket ${exports.BUCKET_NAME} already exists`);
        }
        await exports.minioClient.listObjects(exports.BUCKET_NAME, '', false).toArray();
        logger_1.default.info('✅ MinIO connection verified');
    }
    catch (error) {
        logger_1.default.error('❌ Failed to initialize MinIO:', error);
        throw new Error(`MinIO initialization failed: ${error?.message || 'Unknown error'}`);
    }
}
async function generateUploadUrl(fileName, _contentType, expiresIn = 3600) {
    try {
        const objectName = `uploads/${Date.now()}-${fileName}`;
        const presignedUrl = await exports.minioClient.presignedPutObject(exports.BUCKET_NAME, objectName, expiresIn);
        logger_1.default.info(`Generated upload URL for: ${fileName}`);
        return presignedUrl;
    }
    catch (error) {
        logger_1.default.error('Failed to generate upload URL:', error);
        throw new Error(`Upload URL generation failed: ${error?.message || 'Unknown error'}`);
    }
}
async function generateDownloadUrl(objectName, expiresIn = 3600) {
    try {
        const presignedUrl = await exports.minioClient.presignedGetObject(exports.BUCKET_NAME, objectName, expiresIn);
        logger_1.default.info(`Generated download URL for: ${objectName}`);
        return presignedUrl;
    }
    catch (error) {
        logger_1.default.error('Failed to generate download URL:', error);
        throw new Error(`Download URL generation failed: ${error?.message || 'Unknown error'}`);
    }
}
async function uploadFile(fileName, fileBuffer, contentType, metadata) {
    try {
        const objectName = `uploads/${Date.now()}-${fileName}`;
        const uploadResult = await exports.minioClient.putObject(exports.BUCKET_NAME, objectName, fileBuffer, fileBuffer.length, {
            'Content-Type': contentType,
            ...metadata
        });
        logger_1.default.info(`✅ Uploaded file: ${fileName} as ${objectName}`);
        return {
            objectName,
            etag: uploadResult.etag,
            size: fileBuffer.length
        };
    }
    catch (error) {
        logger_1.default.error('Failed to upload file:', error);
        throw new Error(`File upload failed: ${error?.message || 'Unknown error'}`);
    }
}
async function downloadFile(objectName) {
    try {
        const stream = await exports.minioClient.getObject(exports.BUCKET_NAME, objectName);
        const chunks = [];
        return new Promise((resolve, reject) => {
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('error', (error) => reject(error));
            stream.on('end', () => {
                const buffer = Buffer.concat(chunks);
                logger_1.default.info(`Downloaded file: ${objectName} (${buffer.length} bytes)`);
                resolve(buffer);
            });
        });
    }
    catch (error) {
        logger_1.default.error('Failed to download file:', error);
        throw new Error(`File download failed: ${error?.message || 'Unknown error'}`);
    }
}
async function deleteFile(objectName) {
    try {
        await exports.minioClient.removeObject(exports.BUCKET_NAME, objectName);
        logger_1.default.info(`🗑️ Deleted file: ${objectName}`);
    }
    catch (error) {
        logger_1.default.error('Failed to delete file:', error);
        throw new Error(`File deletion failed: ${error?.message || 'Unknown error'}`);
    }
}
async function getFileInfo(objectName) {
    try {
        const stats = await exports.minioClient.statObject(exports.BUCKET_NAME, objectName);
        return {
            size: stats.size,
            lastModified: stats.lastModified,
            etag: stats.etag,
            contentType: stats.metaData['content-type'] || 'application/octet-stream',
            metadata: stats.metaData
        };
    }
    catch (error) {
        logger_1.default.error('Failed to get file info:', error);
        throw new Error(`File info retrieval failed: ${error?.message || 'Unknown error'}`);
    }
}
async function listFiles(prefix = 'uploads/') {
    try {
        const objectsList = await exports.minioClient.listObjects(exports.BUCKET_NAME, prefix, false).toArray();
        return objectsList.map(obj => ({
            name: obj.name || '',
            size: obj.size || 0,
            lastModified: obj.lastModified || new Date(),
            etag: obj.etag || ''
        }));
    }
    catch (error) {
        logger_1.default.error('Failed to list files:', error);
        throw new Error(`File listing failed: ${error?.message || 'Unknown error'}`);
    }
}
exports.minioConfig = {
    endpoint: MINIO_ENDPOINT,
    bucket: exports.BUCKET_NAME,
    publicUrl: `http://${endpointConfig.endPoint}:${endpointConfig.port}/${exports.BUCKET_NAME}`
};
//# sourceMappingURL=minio.js.map