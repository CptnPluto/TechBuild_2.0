export declare const cache: {
    get<T>(key: string): Promise<T | null>;
    set(key: string, data: any, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    delPattern(pattern: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    expire(key: string, ttl: number): Promise<void>;
};
export declare const cacheKeys: {
    projects: {
        all: string;
        byId: (id: string) => string;
        files: (projectId: string) => string;
        stats: string;
    };
    files: {
        byId: (id: string) => string;
        byProject: (projectId: string) => string;
    };
};
export declare const cacheTTL: {
    projects: number;
    files: number;
    stats: number;
    longTerm: number;
};
export default cache;
//# sourceMappingURL=cache.d.ts.map