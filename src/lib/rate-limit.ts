import { Ratelimit } from "@upstash/ratelimit";
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

// 2. Define Rate Limiters for different contexts
export const rateLimiters = {
  // 10 requests per 10 seconds for AI endpoints
  ai: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "10 s"),
    analytics: true,
  }) : null,
  
  // 5 requests per 10 seconds for uploads
  upload: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "10 s"),
    analytics: true,
  }) : null,
};

// 3. Fallback In-Memory Rate Limiter (For Local Dev without Upstash)
const memoryCache = new Map<string, { count: number, resetAt: number }>();

export async function checkRateLimit(
  context: "ai" | "upload",
  identifier: string = "anonymous"
) {
  const limiter = rateLimiters[context];

  if (limiter) {
    // We have Upstash configured!
    const result = await limiter.limit(`${context}_${identifier}`);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset
    };
  } else {
    // Fallback naive in-memory sliding window
    const now = Date.now();
    const key = `${context}_${identifier}`;
    
    // Limits
    const maxRequests = context === "ai" ? 10 : 5;
    const windowMs = 10000; // 10 seconds

    let record = memoryCache.get(key);

    if (!record || record.resetAt < now) {
      record = { count: 0, resetAt: now + windowMs };
    }

    record.count++;
    memoryCache.set(key, record);

    return {
      success: record.count <= maxRequests,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - record.count),
      reset: record.resetAt
    };
  }
}
