import { serverConfig } from "./config";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function clearExpiredBuckets(now: number): void {
  for (const [key, value] of rateLimitStore) {
    if (value.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export function consumeRateLimit(
  key: string,
  now: number = Date.now()
): RateLimitResult {
  clearExpiredBuckets(now);

  const limit = serverConfig.rateLimitMaxRequests;
  const windowMs = serverConfig.rateLimitWindowMs;
  const existingEntry = rateLimitStore.get(key);

  if (!existingEntry || existingEntry.resetAt <= now) {
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });

    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetAt,
    };
  }

  existingEntry.count += 1;

  const allowed = existingEntry.count <= limit;

  return {
    allowed,
    limit,
    remaining: Math.max(0, limit - existingEntry.count),
    resetAt: existingEntry.resetAt,
  };
}
