const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_TOKEN_FETCH_ERROR =
  'Security token could not be initialized. Please refresh and try again.';
const CSRF_FAILURE_PATTERNS = [
  'csrf validation failed',
  'csrf token',
  'invalid or missing csrf token',
  'csrf',
];
const WORKFLOW_MUTATION_PATHS = [
  /^\/api\/org\/[^/]+\/matches\/[^/]+\/review$/,
  /^\/api\/conversations\/[^/]+\/reveal$/,
  /^\/api\/interviews\/(?:schedule|edit|cancel|complete|no-show)$/,
  /^\/api\/decisions$/,
  /^\/api\/engagement-verifications\/[^/]+$/,
];

let cachedTokenByOrigin = new Map<string, string>();
let pendingTokenByOrigin = new Map<string, Promise<string>>();

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'unknown';
}

function dispatchApiDiagnostic(
  reason: 'csrf_token_request_failed' | 'csrf_token_missing',
  detail: Record<string, unknown> = {}
): void {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
    return;
  }

  try {
    window.dispatchEvent(
      new CustomEvent('proofound:api-diagnostic', {
        detail: {
          reason,
          ...detail,
        },
      })
    );
  } catch {
    // Diagnostics must never affect API request control flow.
  }
}

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

function getPathname(input: RequestInfo | URL): string | null {
  const fallbackOrigin =
    typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';

  try {
    if (input instanceof URL) {
      return input.pathname;
    }

    if (typeof input === 'string') {
      return new URL(input, fallbackOrigin || 'http://localhost').pathname;
    }

    if (typeof Request !== 'undefined' && input instanceof Request) {
      return new URL(input.url, fallbackOrigin || 'http://localhost').pathname;
    }
  } catch {
    return null;
  }

  return null;
}

function shouldAttachWorkflowIdempotencyKey(input: RequestInfo | URL, method: string): boolean {
  if (SAFE_METHODS.has(method)) {
    return false;
  }

  const pathname = getPathname(input);
  return Boolean(pathname && WORKFLOW_MUTATION_PATHS.some((pattern) => pattern.test(pathname)));
}

function createWorkflowIdempotencyKey(): string {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `wf-${random}`;
}

function withWorkflowIdempotencyHeader(
  input: RequestInfo | URL,
  init: RequestInit,
  method: string
) {
  if (!shouldAttachWorkflowIdempotencyKey(input, method)) {
    return init;
  }

  const headers = new Headers(init.headers || {});
  if (!headers.has('Idempotency-Key') && !headers.has('X-Idempotency-Key')) {
    headers.set('Idempotency-Key', createWorkflowIdempotencyKey());
  }

  return {
    ...init,
    headers,
  };
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
      const tokenUrl = `/api/csrf-token?ts=${Date.now()}`;
      const res = await fetch(tokenUrl, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'cache-control': 'no-store',
          pragma: 'no-cache',
        },
      });
      if (!res.ok) {
        dispatchApiDiagnostic('csrf_token_request_failed', { status: res.status });
        throw new Error(CSRF_TOKEN_FETCH_ERROR);
      }

      const data = (await res.json()) as { token?: unknown };
      const token = typeof data.token === 'string' ? data.token.trim() : '';
      if (!token) {
        dispatchApiDiagnostic('csrf_token_missing');
        throw new Error(CSRF_TOKEN_FETCH_ERROR);
      }

      cachedTokenByOrigin.set(originKey, token);
      return token;
    } catch (err) {
      if (getErrorMessage(err) !== CSRF_TOKEN_FETCH_ERROR) {
        dispatchApiDiagnostic('csrf_token_request_failed', { error: getErrorMessage(err) });
      }
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
  const requestInit = withWorkflowIdempotencyHeader(input, init ?? {}, method);

  if (needsCsrf) {
    const originKey = toOriginCacheKey(input);
    const token = await fetchCsrfToken(originKey);

    let response = await fetchWithCsrfToken(input, requestInit, method, token);
    if (!(await isCsrfFailureResponse(response))) {
      return response;
    }

    if (!isRetriableBody(requestInit.body)) {
      return response;
    }

    const refreshedToken = await fetchCsrfToken(originKey, true);
    response = await fetchWithCsrfToken(input, requestInit, method, refreshedToken);
    return response;
  }

  return fetch(input, {
    ...requestInit,
    method,
    credentials: requestInit.credentials ?? 'include',
  });
}

// Test-only helper to reset cached token between test cases
export function __resetCsrfCacheForTests() {
  cachedTokenByOrigin = new Map<string, string>();
  pendingTokenByOrigin = new Map<string, Promise<string>>();
}
