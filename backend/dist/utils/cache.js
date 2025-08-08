"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheTTL = exports.cacheKeys = exports.cache = void 0;
const redis_1 = require("redis");
const logger_1 = __importDefault(require("./logger"));
const redis = (0, redis_1.createClient)({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});
redis.on('error', (err) => {
    logger_1.default.error('Redis Client Error', err);
});
redis.on('connect', () => {
    logger_1.default.info('🔴 Connected to Redis');
});
const connectRedis = async () => {
    try {
        if (!redis.isOpen) {
            await redis.connect();
        }
    }
    catch (error) {
        logger_1.default.error('Failed to connect to Redis:', error);
    }
};
connectRedis();
exports.cache = {
    async get(key) {
        try {
            if (!redis.isOpen)
                await connectRedis();
            const cached = await redis.get(key);
            if (!cached)
                return null;
            return JSON.parse(cached);
        }
        catch (error) {
            logger_1.default.error('Cache get error:', error);
            return null;
        }
    },
    async set(key, data, ttl = 300) {
        try {
            if (!redis.isOpen)
                await connectRedis();
            await redis.setEx(key, ttl, JSON.stringify(data));
            logger_1.default.debug(`Cached data for key: ${key} (TTL: ${ttl}s)`);
        }
        catch (error) {
            logger_1.default.error('Cache set error:', error);
        }
    },
    async del(key) {
        try {
            if (!redis.isOpen)
                await connectRedis();
            await redis.del(key);
            logger_1.default.debug(`Deleted cache for key: ${key}`);
        }
        catch (error) {
            logger_1.default.error('Cache delete error:', error);
        }
    },
    async delPattern(pattern) {
        try {
            if (!redis.isOpen)
                await connectRedis();
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(keys);
                logger_1.default.debug(`Deleted ${keys.length} cache keys matching pattern: ${pattern}`);
            }
        }
        catch (error) {
            logger_1.default.error('Cache delete pattern error:', error);
        }
    },
    async exists(key) {
        try {
            if (!redis.isOpen)
                await connectRedis();
            const exists = await redis.exists(key);
            return exists === 1;
        }
        catch (error) {
            logger_1.default.error('Cache exists error:', error);
            return false;
        }
    },
    async expire(key, ttl) {
        try {
            if (!redis.isOpen)
                await connectRedis();
            await redis.expire(key, ttl);
        }
        catch (error) {
            logger_1.default.error('Cache expire error:', error);
        }
    }
};
exports.cacheKeys = {
    projects: {
        all: 'projects:all',
        byId: (id) => `projects:${id}`,
        files: (projectId) => `projects:${projectId}:files`,
        stats: 'projects:stats'
    },
    files: {
        byId: (id) => `files:${id}`,
        byProject: (projectId) => `files:project:${projectId}`
    }
};
exports.cacheTTL = {
    projects: 300,
    files: 180,
    stats: 60,
    longTerm: 3600
};
exports.default = exports.cache;
//# sourceMappingURL=cache.js.map