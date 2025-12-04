import { getOrGenerateCSRFToken, setCSRFTokenCookie } from '@/lib/csrf'; // eslint-disable-line no-restricted-imports -- server helpers reused for token generation

let cachedToken: string | null = null;
let pendingTokenPromise: Promise<string> | null = null;

async function fetchCsrfToken(): Promise<string> {
  if (cachedToken) return cachedToken;
  if (pendingTokenPromise) return pendingTokenPromise;

  pendingTokenPromise = (async () => {
    try {
      const res = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) {
        console.warn('Failed to fetch CSRF token', res.status);
        return '';
      }
      const data = (await res.json()) as { token?: string };
      cachedToken = data.token || '';
      return cachedToken;
    } catch (err) {
      console.error('Error fetching CSRF token', err);
      return '';
    } finally {
      pendingTokenPromise = null;
    }
  })();

  return pendingTokenPromise;
}

/**
 * Fetch wrapper that automatically includes CSRF token for mutating requests
 * and ensures credentials are sent. Safe methods (GET/HEAD/OPTIONS) are unchanged.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const method = (init?.method || 'GET').toUpperCase();
  const needsCsrf = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  const headers = new Headers(init?.headers || {});

  if (needsCsrf) {
    const token = await fetchCsrfToken();
    if (token) {
      headers.set('x-csrf-token', token);
    }
  }

  return fetch(input, {
    ...init,
    method,
    headers,
    credentials: init?.credentials ?? 'include',
  });
}

// Test-only helper to reset cached token between test cases
export function __resetCsrfCacheForTests() {
  cachedToken = null;
  pendingTokenPromise = null;
}

