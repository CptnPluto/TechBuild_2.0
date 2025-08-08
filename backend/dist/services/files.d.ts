export declare const fileService: {
    uploadFiles(projectId: string, files: Express.Multer.File[], fileType: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        filename: string;
        fileType: string;
        filePath: string;
        fileSize: number | null;
        processingStatus: string;
        processedData: import("@prisma/client/runtime/library").JsonValue | null;
        confidence: number | null;
    }[]>;
    getProjectFiles(projectId: string): Promise<{}>;
    getFileById(id: string): Promise<({
        project: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        filename: string;
        fileType: string;
        filePath: string;
        fileSize: number | null;
        processingStatus: string;
        processedData: import("@prisma/client/runtime/library").JsonValue | null;
        confidence: number | null;
    }) | null>;
    downloadFile(id: string): Promise<{
        file: null;
        buffer: null;
    } | {
        file: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            projectId: string;
            filename: string;
            fileType: string;
            filePath: string;
            fileSize: number | null;
            processingStatus: string;
            processedData: import("@prisma/client/runtime/library").JsonValue | null;
            confidence: number | null;
        };
        buffer: Buffer<ArrayBufferLike>;
    }>;
    deleteFile(id: string): Promise<boolean>;
    getDownloadUrl(id: string): Promise<{
        file: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            projectId: string;
            filename: string;
            fileType: string;
            filePath: string;
            fileSize: number | null;
            processingStatus: string;
            processedData: import("@prisma/client/runtime/library").JsonValue | null;
            confidence: number | null;
        };
        downloadUrl: string;
    } | null>;
    updateProcessingStatus(id: string, status: string, data?: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        filename: string;
        fileType: string;
        filePath: string;
        fileSize: number | null;
        processingStatus: string;
        processedData: import("@prisma/client/runtime/library").JsonValue | null;
        confidence: number | null;
    }>;
    getFileStats(): Promise<{
        totalFiles: number;
        processingFiles: number;
        completedFiles: number;
        failedFiles: number;
    }>;
    updateParsedData(id: string, data: any): Promise<{
        project: {
            id: string;
            name: string;
            description: string | null;
            currentStep: number;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        filename: string;
        fileType: string;
        filePath: string;
        fileSize: number | null;
        processingStatus: string;
        processedData: import("@prisma/client/runtime/library").JsonValue | null;
        confidence: number | null;
    }>;
};
//# sourceMappingURL=files.d.ts.map