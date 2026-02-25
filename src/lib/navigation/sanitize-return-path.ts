function extractCandidate(value: unknown): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed || !trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return null;
  }

  return trimmed;
}

function isAllowedReturnPath(path: string, allowRoot: boolean): boolean {
  if (allowRoot && path === '/') {
    return true;
  }

  return path.startsWith('/app/');
}

export function sanitizeReturnPath(value: unknown, fallback = '/'): string {
  const candidate = extractCandidate(value);
  if (candidate && isAllowedReturnPath(candidate, false)) {
    return candidate;
  }

  const fallbackCandidate = extractCandidate(fallback);
  if (fallbackCandidate && isAllowedReturnPath(fallbackCandidate, true)) {
    return fallbackCandidate;
  }

  return '/';
}
