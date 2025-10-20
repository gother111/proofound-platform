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

type RateLimitDbModule = typeof import('@/db');

let dbModulePromise: Promise<RateLimitDbModule | null> | null = null;

async function loadDbModule(): Promise<RateLimitDbModule | null> {
  if (!dbModulePromise) {
    dbModulePromise = import('@/db').catch((error) => {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('Rate limiter persistent storage unavailable:', error);
      }
      return null;
    });
  }

  return dbModulePromise;
}

function getMemoryStore(): RateLimitStore {
  if (!globalThis.__PROFOUND_RATE_LIMIT_STORE__) {
    globalThis.__PROFOUND_RATE_LIMIT_STORE__ = new Map();
  }

  return globalThis.__PROFOUND_RATE_LIMIT_STORE__;
}

function checkInMemoryRateLimit(id: string, windowMs: number): boolean {
  const store = getMemoryStore();
  const now = Date.now();
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

async function checkPersistentRateLimit(id: string, windowMs: number): Promise<boolean | null> {
  const dbModule = await loadDbModule();
  if (!dbModule) {
    return null;
  }

  const { db, rateLimits } = dbModule;
  try {
    const { eq } = await import('drizzle-orm');
    const now = Date.now();
    const existing = await db.query.rateLimits.findFirst({
      where: eq(rateLimits.id, id),
    });

    const resetAtMs = existing?.resetAt ? new Date(existing.resetAt).getTime() : 0;

    if (!existing || resetAtMs <= now) {
      const resetAt = new Date(now + windowMs);

      await db
        .insert(rateLimits)
        .values({ id, attempts: 1, resetAt })
        .onConflictDoUpdate({
          target: rateLimits.id,
          set: { attempts: 1, resetAt },
        });

      return true;
    }

    const currentAttempts = Number(existing.attempts ?? 0);
    const attempts = currentAttempts + 1;

    await db.update(rateLimits).set({ attempts }).where(eq(rateLimits.id, id));

    return attempts <= MAX_REQUESTS;
  } catch (error) {
    console.error(
      'Rate limiter persistent storage failed, falling back to in-memory store:',
      error
    );
    return null;
  }
}

export async function checkRateLimit(identifier: string, route: string): Promise<boolean> {
  const id = `${identifier}:${route}`;
  const windowMs = WINDOW_SECONDS * 1000;

  const persistentResult = await checkPersistentRateLimit(id, windowMs);
  if (persistentResult !== null) {
    return persistentResult;
  }

  return checkInMemoryRateLimit(id, windowMs);
}

export function getRateLimitIdentifier(ip?: string | null): string {
  return ip || 'unknown';
}
