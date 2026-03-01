const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_TOKEN_FETCH_ERROR =
  'Security token could not be initialized. Please refresh and try again.';
const CSRF_FAILURE_PATTERNS = [
  'csrf validation failed',
  'csrf token',
  'invalid or missing csrf token',
  'csrf',
];

let cachedTokenByOrigin = new Map<string, string>();
let pendingTokenByOrigin = new Map<string, Promise<string>>();

function toOriginCacheKey(input: RequestInfo | URL): string {
  const fallbackOrigin =
    typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';

  try {
    if (input instanceof URL) {
      return input.origin || fallbackOrigin || 'default-origin';
    }

    if (typeof input === 'string') {
      const origin = new URL(input, fallbackOrigin || 'http://localhost').origin;
      return origin || fallbackOrigin || 'default-origin';
    }

    if (typeof Request !== 'undefined' && input instanceof Request) {
      const origin = new URL(input.url, fallbackOrigin || 'http://localhost').origin;
      return origin || fallbackOrigin || 'default-origin';
    }
  } catch {
    // Ignore parse failures and fall through to fallback.
  }

  return fallbackOrigin || 'default-origin';
}

function resetCsrfCacheForOrigin(originKey: string): void {
  cachedTokenByOrigin.delete(originKey);
  pendingTokenByOrigin.delete(originKey);
}

async function fetchCsrfToken(originKey: string, forceRefresh = false): Promise<string> {
  if (forceRefresh) {
    resetCsrfCacheForOrigin(originKey);
  }

  const cached = cachedTokenByOrigin.get(originKey);
  if (cached) {
    return cached;
  }

  const pending = pendingTokenByOrigin.get(originKey);
  if (pending) {
    return pending;
  }

  const tokenPromise = (async () => {
    try {
      const res = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) {
        console.warn('Failed to fetch CSRF token', res.status);
        throw new Error(CSRF_TOKEN_FETCH_ERROR);
      }

      const data = (await res.json()) as { token?: unknown };
      const token = typeof data.token === 'string' ? data.token.trim() : '';
      if (!token) {
        throw new Error(CSRF_TOKEN_FETCH_ERROR);
      }

      cachedTokenByOrigin.set(originKey, token);
      return token;
    } catch (err) {
      console.error('Error fetching CSRF token', err);
      throw new Error(CSRF_TOKEN_FETCH_ERROR);
    } finally {
      pendingTokenByOrigin.delete(originKey);
    }
  })();

  pendingTokenByOrigin.set(originKey, tokenPromise);
  return tokenPromise;
}

function isRetriableBody(body: RequestInit['body']): boolean {
  if (!body) {
    return true;
  }

  if (typeof ReadableStream !== 'undefined' && body instanceof ReadableStream) {
    return false;
  }

  return true;
}

async function isCsrfFailureResponse(response: Response): Promise<boolean> {
  if (response.status !== 403) {
    return false;
  }

  try {
    const payload = (await response.clone().json()) as Record<string, unknown>;
    const error = typeof payload.error === 'string' ? payload.error.toLowerCase() : '';
    const message = typeof payload.message === 'string' ? payload.message.toLowerCase() : '';
    return CSRF_FAILURE_PATTERNS.some(
      (pattern) => error.includes(pattern) || message.includes(pattern)
    );
  } catch {
    try {
      const text = (await response.clone().text()).toLowerCase();
      return CSRF_FAILURE_PATTERNS.some((pattern) => text.includes(pattern));
    } catch {
      return false;
    }
  }
}

async function fetchWithCsrfToken(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  method: string,
  token: string
): Promise<Response> {
  const headers = new Headers(init?.headers || {});
  headers.set('x-csrf-token', token);

  return fetch(input, {
    ...init,
    method,
    headers,
    credentials: init?.credentials ?? 'include',
  });
}

/**
 * Fetch wrapper that automatically includes CSRF token for mutating requests
 * and ensures credentials are sent. Safe methods (GET/HEAD/OPTIONS) are unchanged.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const method = (init?.method || 'GET').toUpperCase();
  const needsCsrf = !SAFE_METHODS.has(method);

  if (needsCsrf) {
    const originKey = toOriginCacheKey(input);
    const token = await fetchCsrfToken(originKey);

    let response = await fetchWithCsrfToken(input, init, method, token);
    if (!(await isCsrfFailureResponse(response))) {
      return response;
    }

    if (!isRetriableBody(init?.body)) {
      return response;
    }

    const refreshedToken = await fetchCsrfToken(originKey, true);
    response = await fetchWithCsrfToken(input, init, method, refreshedToken);
    return response;
  }

  return fetch(input, {
    ...init,
    method,
    credentials: init?.credentials ?? 'include',
  });
}

// Test-only helper to reset cached token between test cases
export function __resetCsrfCacheForTests() {
  cachedTokenByOrigin = new Map<string, string>();
  pendingTokenByOrigin = new Map<string, Promise<string>>();
}
