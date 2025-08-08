import { Client } from 'minio';
import logger from '@/utils/logger';

let minioClient: Client;

export const initializeMinIO = async (): Promise<void> => {
  try {
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = parseInt(process.env.MINIO_PORT || '9000');
    const accessKey = process.env.MINIO_ACCESS_KEY || 'minioaccess';
    const secretKey = process.env.MINIO_SECRET_KEY || 'miniosecret';
    const bucketName = process.env.MINIO_BUCKET_NAME || 'techbuild-documents';

    minioClient = new Client({
      endPoint: endpoint,
      port: port,
      useSSL: false,
      accessKey: accessKey,
      secretKey: secretKey,
    });

    // Check if bucket exists, create if it doesn't
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      logger.info(`📁 Created MinIO bucket: ${bucketName}`);
    } else {
      logger.info(`📁 MinIO bucket exists: ${bucketName}`);
    }

    logger.info('✅ MinIO initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize MinIO:', error);
    throw error;
  }
};

export const getMinioClient = (): Client => {
  if (!minioClient) {
    throw new Error('MinIO client not initialized. Call initializeMinIO first.');
  }
  return minioClient;
};

export const uploadFile = async (
  bucketName: string,
  objectName: string,
  stream: NodeJS.ReadableStream,
  size?: number,
  metaData?: Record<string, string>
): Promise<void> => {
  try {
    const client = getMinioClient();
    await client.putObject(bucketName, objectName, stream, size, metaData);
    logger.info(`📁 Uploaded file to MinIO: ${objectName}`);
  } catch (error) {
    logger.error(`❌ Failed to upload file ${objectName}:`, error);
    throw error;
  }
};

export const downloadFile = async (
  bucketName: string,
  objectName: string
): Promise<NodeJS.ReadableStream> => {
  try {
    const client = getMinioClient();
    const stream = await client.getObject(bucketName, objectName);
    logger.info(`📁 Downloaded file from MinIO: ${objectName}`);
    return stream;
  } catch (error) {
    logger.error(`❌ Failed to download file ${objectName}:`, error);
    throw error;
  }
};

export const deleteFile = async (
  bucketName: string,
  objectName: string
): Promise<void> => {
  try {
    const client = getMinioClient();
    await client.removeObject(bucketName, objectName);
    logger.info(`📁 Deleted file from MinIO: ${objectName}`);
  } catch (error) {
    logger.error(`❌ Failed to delete file ${objectName}:`, error);
    throw error;
  }
};

export const getFileUrl = (bucketName: string, objectName: string): string => {
  const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
  const port = process.env.MINIO_PORT || '9000';
  return `http://${endpoint}:${port}/${bucketName}/${objectName}`;
};