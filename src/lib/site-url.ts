export type HeaderGetter = {
  get(name: string): string | null | undefined;
};

function normalizeSiteUrl(
  value: string | null | undefined,
  { allowPreviewHosts = false }: { allowPreviewHosts?: boolean } = {}
): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed);
  const withScheme = hasScheme ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withScheme);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }

    const previewHost = isPreviewHostname(url.hostname);
    if (
      !allowPreviewHosts &&
      previewHost &&
      !isLocalHostname(url.hostname) &&
      !isPreviewDeployment()
    ) {
      return null;
    }

    return url.origin;
  } catch (_) {
    return null;
  }
}

function isLocalHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

function isPreviewHostname(hostname: string): boolean {
  return /\.vercel\.app$/i.test(hostname);
}

function isPreviewDeployment(): boolean {
  return process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV !== 'production';
}

function resolveProtocol(headersList: HeaderGetter, host: string): string {
  const forwardedProto = headersList.get('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto;
  }

  if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
    return 'http';
  }

  return 'https';
}

export function resolveSiteUrl(headersList: HeaderGetter): string | null {
  const configuredSiteUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL, {
    allowPreviewHosts: true,
  });
  if (configuredSiteUrl) {
    return configuredSiteUrl;
  }

  const origin = normalizeSiteUrl(headersList.get('origin'));
  if (origin) {
    return origin;
  }

  const forwardedHost = headersList.get('x-forwarded-host');
  if (forwardedHost) {
    const forwardedProto = headersList.get('x-forwarded-proto') ?? 'https';
    const forwardedUrl = normalizeSiteUrl(`${forwardedProto}://${forwardedHost}`);
    if (forwardedUrl) {
      return forwardedUrl;
    }
  }

  const host = headersList.get('host');
  if (host) {
    const proto = resolveProtocol(headersList, host);
    const hostUrl = normalizeSiteUrl(`${proto}://${host}`);
    if (hostUrl) {
      return hostUrl;
    }
  }

  const referer = headersList.get('referer');
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const normalizedReferer = normalizeSiteUrl(refererUrl.origin);
      if (normalizedReferer) {
        return normalizedReferer;
      }
    } catch (error) {
      // Ignore malformed referer header values
    }
  }

  const vercelUrl = normalizeSiteUrl(process.env.VERCEL_URL);
  if (vercelUrl) {
    return vercelUrl;
  }

  return null;
}
