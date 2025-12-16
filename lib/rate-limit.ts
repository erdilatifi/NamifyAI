type Bucket = {
  count: number;
  resetAt: number;
};

type Store = Map<string, Bucket>;

type RateLimitGlobal = typeof globalThis & {
  __NAMIFY_RATE_LIMIT_STORE__?: Store;
};

function getStore(): Store {
  const g = globalThis as RateLimitGlobal;
  if (!g.__NAMIFY_RATE_LIMIT_STORE__) g.__NAMIFY_RATE_LIMIT_STORE__ = new Map();
  return g.__NAMIFY_RATE_LIMIT_STORE__;
}

export function checkRateLimit(params: { key: string; limit: number; windowMs: number }) {
  const now = Date.now();
  const store = getStore();

  const existing = store.get(params.key);
  if (!existing || existing.resetAt <= now) {
    const bucket: Bucket = { count: 1, resetAt: now + params.windowMs };
    store.set(params.key, bucket);
    return {
      allowed: true,
      remaining: Math.max(0, params.limit - bucket.count),
      resetAt: bucket.resetAt,
    };
  }

  existing.count += 1;
  store.set(params.key, existing);

  return {
    allowed: existing.count <= params.limit,
    remaining: Math.max(0, params.limit - existing.count),
    resetAt: existing.resetAt,
  };
}

export function rateLimitHeaders(params: { limit: number; remaining: number; resetAt: number }) {
  const retryAfterSeconds = Math.max(0, Math.ceil((params.resetAt - Date.now()) / 1000));
  return {
    "Retry-After": String(retryAfterSeconds),
    "X-RateLimit-Limit": String(params.limit),
    "X-RateLimit-Remaining": String(params.remaining),
    "X-RateLimit-Reset": String(params.resetAt),
  };
}
