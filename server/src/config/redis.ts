import { createClient } from 'redis';

let redisClient: any;
let isRedisAvailable = false;

const initRedis = async () => {
    try {
        const client = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            socket: {
                connectTimeout: 1000,
                reconnectStrategy: false
            }
        });

        client.on('error', (err) => {
            // console.error('Redis Client Error', err); // Optional: uncomment for debugging
        });

        // Force a timeout if connect() hangs
        const connectPromise = client.connect();
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Redis Connection Timeout')), 1000)
        );

        await Promise.race([connectPromise, timeoutPromise]);

        isRedisAvailable = true;
        redisClient = client;
        console.log('Redis Connected');
    } catch (err) {
        console.warn('Redis connection failed (or timed out). Using In-Memory fallback.');
        redisClient = new Map();
        isRedisAvailable = false;
    }
};

export const getCache = async (key: string): Promise<string | null> => {
    if (isRedisAvailable) {
        return await redisClient.get(key);
    } else {
        return redisClient.get(key) || null;
    }
};

export const setCache = async (key: string, value: string, ttl: number = 3600): Promise<void> => {
    if (isRedisAvailable) {
        await redisClient.set(key, value, { EX: ttl });
    } else {
        redisClient.set(key, value);
    }
}

// Simple In-Memory Stats (Fallback if Redis is mostly used for caching)
const globalStats = {
    totalSearches: 0,
    totalUsers: 8400, // Mock for now until Auth
    revenue: 1245.00, // Mock base
    recentQueries: [] as string[]
};

export const trackSearch = async (query: string): Promise<void> => {
    // 1. Increment Search Count
    if (isRedisAvailable) {
        await redisClient.incr('stats:searches');
        await redisClient.lPush('stats:recent_queries', query);
        await redisClient.lTrim('stats:recent_queries', 0, 99); // Keep last 100
    } else {
        globalStats.totalSearches++;
        globalStats.recentQueries.unshift(query);
        if (globalStats.recentQueries.length > 100) globalStats.recentQueries.pop();
        globalStats.revenue += 0.10; // Fake revenue logic
    }
};

export const getStats = async () => {
    if (isRedisAvailable) {
        const total = await redisClient.get('stats:searches') || '0';
        const recent = await redisClient.lRange('stats:recent_queries', 0, 9);
        return {
            totalSearches: parseInt(total),
            totalUsers: 8500,
            revenue: 1250 + (parseInt(total) * 0.1),
            recentQueries: recent
        };
    } else {
        return globalStats;
    }
};

export { initRedis, isRedisAvailable, redisClient };
