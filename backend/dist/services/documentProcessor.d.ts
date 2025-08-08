export interface ProcessingJob {
    id: string;
    fileId: string;
    taskType: 'door_schedule' | 'hardware_data' | 'validation';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: any;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const documentProcessor: {
    queueFileForProcessing(fileId: string, taskType?: "door_schedule" | "hardware_data" | "validation"): Promise<ProcessingJob>;
    processFileAsync(job: ProcessingJob): Promise<void>;
    getProcessingStatus(fileId: string): Promise<{
        fileId: string;
        filename: string;
        status: string;
        result: import("@prisma/client/runtime/library").JsonValue;
        lastUpdated: Date;
    }>;
    getProjectResults(projectId: string): Promise<{
        fileId: string;
        filename: string;
        fileType: string;
        results: import("@prisma/client/runtime/library").JsonValue;
        processedAt: Date;
    }[]>;
    callAIService(endpoint: string, data: any): Promise<any>;
    callAIServiceWithFile(endpoint: string, fileBuffer: Buffer, filename: string): Promise<any>;
    getMimeTypeFromFilename(filename: string): string;
    saveRawExtractionData(fileId: string, projectId: string, rawData: any): Promise<void>;
    getRawExtractionData(fileId: string): Promise<({
        file: {
            filename: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        fileId: string;
        extractionMethods: import("@prisma/client/runtime/library").JsonValue;
        totalTables: number;
        textContent: string | null;
        tablesData: import("@prisma/client/runtime/library").JsonValue;
        rawResults: import("@prisma/client/runtime/library").JsonValue;
        confidenceScores: import("@prisma/client/runtime/library").JsonValue;
        totalTextLength: number;
        processingTime: number | null;
    }) | null>;
    checkAIServiceHealth(): Promise<{
        available: boolean;
        status: string;
        responseTime?: number;
    }>;
    createProcessingLog(fileId: string, level: "DEBUG" | "INFO" | "WARN" | "ERROR", message: string, method?: string | null, metadata?: Record<string, any>): Promise<void>;
};
//# sourceMappingURL=documentProcessor.d.ts.map