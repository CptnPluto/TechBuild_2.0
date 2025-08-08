export interface ProcessingLogData {
    jobId?: string | null;
    fileId: string;
    projectId: string;
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    message: string;
    method?: string | null;
    metadata?: Record<string, any> | null;
}
export declare class LoggingService {
    static log(data: ProcessingLogData): Promise<void>;
    static info(fileId: string, projectId: string, message: string, method?: string | null, metadata?: Record<string, any> | null, jobId?: string | null): Promise<void>;
    static warn(fileId: string, projectId: string, message: string, method?: string | null, metadata?: Record<string, any> | null, jobId?: string | null): Promise<void>;
    static error(fileId: string, projectId: string, message: string, method?: string | null, metadata?: Record<string, any> | null, jobId?: string | null): Promise<void>;
    static debug(fileId: string, projectId: string, message: string, method?: string | null, metadata?: Record<string, any> | null, jobId?: string | null): Promise<void>;
    static parseAndStoreAILog(aiLogEntry: string, fileId: string, projectId: string, jobId?: string): Promise<void>;
    private static cleanLogMessage;
    static logExtractionSummary(fileId: string, projectId: string, jobId: string, methodResults: Array<{
        method: string;
        success: boolean;
        tablesFound: number;
        confidence?: number;
        error?: string;
    }>): Promise<void>;
    static simulateProcessingLogs(fileId: string, projectId: string, filename: string): Promise<void>;
    static cleanupOldLogs(daysToKeep?: number): Promise<void>;
}
export default LoggingService;
//# sourceMappingURL=loggingService.d.ts.map