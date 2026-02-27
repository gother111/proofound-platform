export const PLATFORM_PERF_CACHE_TTL_MS = 30_000;

type InternalCacheEntry = {
  expiresAt: number;
  hasValue: boolean;
  value?: unknown;
  inFlight?: Promise<unknown>;
};

export type TtlCacheEntry<T = unknown> = {
  expiresAt: number;
  value: T;
};

export type TtlCacheOptions = {
  ttlMs?: number;
  now?: () => number;
};

const store = new Map<string, InternalCacheEntry>();

export async function getOrSetTtlCache<T>(
  key: string,
  compute: () => Promise<T>,
  options: TtlCacheOptions = {}
): Promise<T> {
  const ttlMs = options.ttlMs ?? PLATFORM_PERF_CACHE_TTL_MS;
  const now = options.now ?? Date.now;
  const nowMs = now();
  const existing = store.get(key);

  if (existing?.inFlight) {
    return existing.inFlight as Promise<T>;
  }

  if (existing?.hasValue && existing.expiresAt > nowMs) {
    return existing.value as T;
  }

  const inFlight = compute()
    .then((value) => {
      store.set(key, {
        expiresAt: now() + ttlMs,
        hasValue: true,
        value,
      });
      return value;
    })
    .catch((error) => {
      const current = store.get(key);
      if (current?.inFlight === inFlight) {
        store.delete(key);
      }
      throw error;
    });

  store.set(key, {
    expiresAt: nowMs + ttlMs,
    hasValue: false,
    inFlight,
  });

  return inFlight;
}

export function getTtlCacheEntry<T = unknown>(key: string): TtlCacheEntry<T> | null {
  const entry = store.get(key);
  if (!entry?.hasValue) {
    return null;
  }

  return {
    expiresAt: entry.expiresAt,
    value: entry.value as T,
  };
}

export function deleteTtlCacheEntry(key: string): void {
  store.delete(key);
}

export function clearTtlCache(): void {
  store.clear();
}
