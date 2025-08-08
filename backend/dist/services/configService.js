"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("@/utils/logger"));
const prisma = new client_1.PrismaClient();
class ConfigService {
    aiProvidersCache = null;
    processingDefaultsCache = null;
    cacheExpiry = null;
    CACHE_TTL = 5 * 60 * 1000;
    async getAIProviderConfig(providerName) {
        const dbConfig = await this.getAIProvidersFromDB();
        const providerConfig = dbConfig[providerName];
        if (!providerConfig) {
            throw new Error(`Provider ${providerName} not configured`);
        }
        return {
            enabled: providerConfig.enabled,
            model: process.env[`${providerName.toUpperCase()}_MODEL`] || providerConfig.model,
            maxTokens: process.env[`${providerName.toUpperCase()}_MAX_TOKENS`] ?
                parseInt(process.env[`${providerName.toUpperCase()}_MAX_TOKENS`]) :
                providerConfig.maxTokens,
            endpoint: process.env[`${providerName.toUpperCase()}_ENDPOINT`] || providerConfig.endpoint,
            features: providerConfig.features
        };
    }
    async getProcessingDefaults() {
        const dbDefaults = await this.getProcessingDefaultsFromDB();
        return {
            confidenceThreshold: process.env.AI_CONFIDENCE_THRESHOLD ? parseFloat(process.env.AI_CONFIDENCE_THRESHOLD) : dbDefaults.confidenceThreshold,
            retryOnFailure: process.env.AI_RETRY_ON_FAILURE ? process.env.AI_RETRY_ON_FAILURE === 'true' : dbDefaults.retryOnFailure,
            maxRetries: process.env.AI_MAX_RETRIES ? parseInt(process.env.AI_MAX_RETRIES) : dbDefaults.maxRetries,
            defaultProvider: process.env.DEFAULT_AI_PROVIDER || dbDefaults.defaultProvider,
            fallbackProvider: process.env.FALLBACK_AI_PROVIDER || dbDefaults.fallbackProvider
        };
    }
    getAPIKey(providerName) {
        const envKey = `${providerName.toUpperCase()}_API_KEY`;
        return process.env[envKey];
    }
    async isProviderReady(providerName) {
        try {
            const config = await this.getAIProviderConfig(providerName);
            const apiKey = this.getAPIKey(providerName);
            return config.enabled && !!apiKey;
        }
        catch (error) {
            return false;
        }
    }
    async getAvailableProviders() {
        const dbConfig = await this.getAIProvidersFromDB();
        const providers = Object.keys(dbConfig);
        const availableProviders = [];
        for (const provider of providers) {
            if (await this.isProviderReady(provider)) {
                availableProviders.push(provider);
            }
        }
        return availableProviders;
    }
    async updateProviderConfig(providerName, updates) {
        try {
            const currentConfig = await this.getAIProvidersFromDB();
            const updatedConfig = {
                ...currentConfig,
                [providerName]: {
                    ...currentConfig[providerName],
                    ...updates
                }
            };
            await prisma.systemConfig.upsert({
                where: { key: 'ai_providers' },
                update: { value: updatedConfig },
                create: { key: 'ai_providers', value: updatedConfig }
            });
            this.clearCache();
            logger_1.default.info(`Updated provider config for ${providerName}`);
        }
        catch (error) {
            logger_1.default.error(`Error updating provider config for ${providerName}:`, error);
            throw error;
        }
    }
    async updateProcessingDefaults(updates) {
        try {
            const currentDefaults = await this.getProcessingDefaultsFromDB();
            const updatedDefaults = { ...currentDefaults, ...updates };
            await prisma.systemConfig.upsert({
                where: { key: 'processing_defaults' },
                update: { value: updatedDefaults },
                create: { key: 'processing_defaults', value: updatedDefaults }
            });
            this.clearCache();
            logger_1.default.info('Updated processing defaults');
        }
        catch (error) {
            logger_1.default.error('Error updating processing defaults:', error);
            throw error;
        }
    }
    async getAIProvidersFromDB() {
        if (this.aiProvidersCache && this.isCacheValid()) {
            return this.aiProvidersCache;
        }
        try {
            const config = await prisma.systemConfig.findUnique({
                where: { key: 'ai_providers' }
            });
            const providers = config?.value || {
                openai: {
                    enabled: true,
                    model: 'gpt-4o',
                    maxTokens: 4096,
                    endpoint: process.env.AI_SERVICE_URL || 'http://localhost:8000'
                },
                anthropic: {
                    enabled: false,
                    model: 'claude-3-sonnet',
                    maxTokens: 8000,
                    endpoint: process.env.AI_SERVICE_URL || 'http://localhost:8000'
                }
            };
            this.aiProvidersCache = providers;
            this.cacheExpiry = new Date(Date.now() + this.CACHE_TTL);
            return providers;
        }
        catch (error) {
            logger_1.default.error('Error fetching AI providers config:', error);
            return {
                openai: { enabled: true, model: 'gpt-4o', maxTokens: 4096 }
            };
        }
    }
    async getProcessingDefaultsFromDB() {
        if (this.processingDefaultsCache && this.isCacheValid()) {
            return this.processingDefaultsCache;
        }
        try {
            const config = await prisma.systemConfig.findUnique({
                where: { key: 'processing_defaults' }
            });
            const defaults = config?.value || {
                confidenceThreshold: 0.8,
                retryOnFailure: true,
                maxRetries: 3,
                defaultProvider: 'openai'
            };
            this.processingDefaultsCache = defaults;
            this.cacheExpiry = new Date(Date.now() + this.CACHE_TTL);
            return defaults;
        }
        catch (error) {
            logger_1.default.error('Error fetching processing defaults:', error);
            return {
                confidenceThreshold: 0.8,
                retryOnFailure: true,
                maxRetries: 3,
                defaultProvider: 'openai'
            };
        }
    }
    isCacheValid() {
        return this.cacheExpiry !== null && new Date() < this.cacheExpiry;
    }
    clearCache() {
        this.aiProvidersCache = null;
        this.processingDefaultsCache = null;
        this.cacheExpiry = null;
    }
}
exports.configService = new ConfigService();
//# sourceMappingURL=configService.js.map