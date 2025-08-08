import { Client as MinIOClient } from 'minio';
export declare const minioClient: MinIOClient;
export declare const BUCKET_NAME: string;
export declare function initializeMinIO(): Promise<void>;
export declare function generateUploadUrl(fileName: string, _contentType: string, expiresIn?: number): Promise<string>;
export declare function generateDownloadUrl(objectName: string, expiresIn?: number): Promise<string>;
export declare function uploadFile(fileName: string, fileBuffer: Buffer, contentType: string, metadata?: Record<string, string>): Promise<{
    objectName: string;
    etag: string;
    size: number;
}>;
export declare function downloadFile(objectName: string): Promise<Buffer>;
export declare function deleteFile(objectName: string): Promise<void>;
export declare function getFileInfo(objectName: string): Promise<{
    size: number;
    lastModified: Date;
    etag: string;
    contentType: string;
    metadata: Record<string, string>;
}>;
export declare function listFiles(prefix?: string): Promise<Array<{
    name: string;
    size: number;
    lastModified: Date;
    etag: string;
}>>;
export declare const minioConfig: {
    endpoint: string;
    bucket: string;
    publicUrl: string;
};
//# sourceMappingURL=minio.d.ts.map