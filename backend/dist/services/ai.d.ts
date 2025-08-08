export interface ProcessFileRequest {
    file_id: string;
    processing_type: 'door_schedule' | 'hardware_data' | 'validation';
    provider?: string;
    options?: {
        confidence_threshold?: number;
        retry_on_failure?: boolean;
    };
}
export interface AIProvider {
    name: string;
    enabled: boolean;
    model?: string;
    endpoint: string;
    status: 'online' | 'offline' | 'error';
}
export declare const aiService: {
    processFile(request: ProcessFileRequest): Promise<{
        jobId: string;
        status: string;
        message: string;
    }>;
    processFileAsync(jobId: string, file: any, request: ProcessFileRequest): Promise<void>;
    callRealAIService(fileId: string, processingType: string, provider?: string): Promise<any>;
    generateMockResult(processingType: string, _filename: string): {
        doors: {
            mark: string;
            door_type: string;
            door_material: string;
            door_width: string;
            door_height: string;
            frame_type: string;
            frame_material: string;
            opening_type: string;
            quantity: number;
            hardware_set: string;
        }[];
        extraction_info: {
            pages_processed: number;
            total_doors_found: number;
            confidence_score: number;
            total_sets_found?: never;
        };
        hardware_sets?: never;
        validation_results?: never;
    } | {
        hardware_sets: {
            set_name: string;
            components: {
                name: string;
                type: string;
                quantity: number;
                manufacturer: string;
                model: string;
            }[];
        }[];
        extraction_info: {
            pages_processed: number;
            total_sets_found: number;
            confidence_score: number;
            total_doors_found?: never;
        };
        doors?: never;
        validation_results?: never;
    } | {
        validation_results: {
            valid: boolean;
            warnings: never[];
            errors: never[];
        };
        doors?: never;
        extraction_info?: never;
        hardware_sets?: never;
    };
    getProcessingStatus(jobId: string): Promise<{
        error: string | null;
        result: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        status: string;
        createdAt: Date;
        confidence: number | null;
        fileId: string;
        provider: string;
        jobType: string;
        progress: number;
        startedAt: Date | null;
        completedAt: Date | null;
    } | null>;
    getAvailableProviders(): Promise<AIProvider[]>;
    testProvider(providerName: string): Promise<{
        provider: string;
        status: string;
        responseTime: number;
        testResult: string;
        timestamp: string;
        details: {
            error: string;
            configuration: {
                enabled: boolean;
                hasApiKey: boolean;
                model: string;
                endpoint: string | undefined;
                maxTokens?: never;
            };
            healthCheck?: never;
            processingTest?: never;
        };
    } | {
        provider: string;
        status: string;
        responseTime: number;
        testResult: string;
        timestamp: string;
        details: {
            healthCheck: string;
            processingTest: string;
            configuration: {
                model: string;
                maxTokens: number;
                endpoint: string | undefined;
                enabled?: never;
                hasApiKey?: never;
            };
            error?: never;
        };
    } | {
        provider: string;
        status: string;
        responseTime: number;
        testResult: string;
        timestamp: string;
        details: {
            error: any;
            healthCheck: string;
            configuration: {
                model: string;
                maxTokens: number;
                endpoint: string | undefined;
                enabled?: never;
                hasApiKey?: never;
            };
            processingTest?: never;
        };
    }>;
    compareProviders(fileId: string, providers: string[], processingType: string): Promise<{
        fileId: string;
        processingType: string;
        results: ({
            provider: string;
            confidence: any;
            processingTime: number;
            accuracy: any;
            cost: number;
            status: string;
            data: any;
            error?: never;
        } | {
            provider: string;
            confidence: number;
            processingTime: number;
            accuracy: number;
            cost: number;
            status: string;
            error: any;
            data?: never;
        })[];
        recommendation: string | undefined;
        comparisonTimestamp: string;
    }>;
    estimateProviderCost(provider: string, processingTime: number): number;
    getDefaultProvider(): Promise<string>;
    getConfiguredProviders(): Promise<string[]>;
};
//# sourceMappingURL=ai.d.ts.map