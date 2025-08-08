export interface AIProviderConfig {
    enabled: boolean;
    model: string;
    maxTokens: number;
    endpoint?: string | undefined;
    features?: string[] | undefined;
}
export interface ProcessingDefaults {
    confidenceThreshold: number;
    retryOnFailure: boolean;
    maxRetries: number;
    defaultProvider: string;
    fallbackProvider?: string | undefined;
}
declare class ConfigService {
    private aiProvidersCache;
    private processingDefaultsCache;
    private cacheExpiry;
    private readonly CACHE_TTL;
    getAIProviderConfig(providerName: string): Promise<AIProviderConfig>;
    getProcessingDefaults(): Promise<ProcessingDefaults>;
    getAPIKey(providerName: string): string | undefined;
    isProviderReady(providerName: string): Promise<boolean>;
    getAvailableProviders(): Promise<string[]>;
    updateProviderConfig(providerName: string, updates: Partial<AIProviderConfig>): Promise<void>;
    updateProcessingDefaults(updates: Partial<ProcessingDefaults>): Promise<void>;
    private getAIProvidersFromDB;
    private getProcessingDefaultsFromDB;
    private isCacheValid;
    private clearCache;
}
export declare const configService: ConfigService;
export {};
//# sourceMappingURL=configService.d.ts.map