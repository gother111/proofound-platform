const WINDOW_SECONDS = parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || '60', 10);
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX || '30', 10);

type RateLimitEntry = {
  attempts: number;
  resetAt: number;
};

type RateLimitStore = Map<string, RateLimitEntry>;

declare global {
  // eslint-disable-next-line no-var
  var __PROFOUND_RATE_LIMIT_STORE__: RateLimitStore | undefined;
}

function getStore(): RateLimitStore {
  if (!globalThis.__PROFOUND_RATE_LIMIT_STORE__) {
    globalThis.__PROFOUND_RATE_LIMIT_STORE__ = new Map();
  }

  return globalThis.__PROFOUND_RATE_LIMIT_STORE__;
}

export async function checkRateLimit(identifier: string, route: string): Promise<boolean> {
  const id = `${identifier}:${route}`;
  const store = getStore();
  const now = Date.now();
  const windowMs = WINDOW_SECONDS * 1000;

  const existing = store.get(id);

  if (!existing || existing.resetAt <= now) {
    store.set(id, {
      attempts: 1,
      resetAt: now + windowMs,
    });

    return true;
  }

  const attempts = existing.attempts + 1;
  store.set(id, {
    attempts,
    resetAt: existing.resetAt,
  });

  return attempts <= MAX_REQUESTS;
}

export function getRateLimitIdentifier(ip?: string | null): string {
  return ip || 'unknown';
}
