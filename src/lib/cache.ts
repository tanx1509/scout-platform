import { Redis } from "@upstash/redis";
import { env } from "./env";

// 1. Setup Redis (or fallback to dummy if not configured)
let redis: Redis | null = null;
if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// 2. Fallback In-Memory Cache (For Local Dev without Upstash)
const memoryCache = new Map<string, { value: any, expiresAt: number }>();

/**
 * Generic Caching wrapper.
 * Checks Cache -> If hit, returns.
 * If miss, executes fetcher(), caches it for ttlSeconds, and returns.
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // Check Redis
  if (redis) {
    const cachedValue = await redis.get<T>(key);
    if (cachedValue !== null) {
      return cachedValue;
    }

    const freshData = await fetcher();
    await redis.set(key, freshData, { ex: ttlSeconds });
    return freshData;
  }

  // Fallback to memory
  const cachedRecord = memoryCache.get(key);
  const now = Date.now();

  if (cachedRecord && cachedRecord.expiresAt > now) {
    return cachedRecord.value;
  }

  const freshData = await fetcher();
  memoryCache.set(key, { value: freshData, expiresAt: now + (ttlSeconds * 1000) });
  
  return freshData;
}
