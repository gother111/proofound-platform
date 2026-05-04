import type { GcpCvOcrConfig } from '@/lib/expertise/gcp-cv-ocr-config';

type FetchLike = typeof fetch;

export type VercelOidcTokenFactory = () => Promise<string | null> | string | null;

type ResolveGcpCvOcrOidcTokenOptions = {
  config: Pick<
    GcpCvOcrConfig,
    | 'baseUrl'
    | 'oidcAudience'
    | 'oidcProjectNumber'
    | 'oidcWorkloadIdentityPoolId'
    | 'oidcWorkloadIdentityProviderId'
    | 'oidcServiceAccountEmail'
  >;
  fetchImpl?: FetchLike;
  vercelOidcTokenFactory?: VercelOidcTokenFactory;
  nowMs?: () => number;
};

const STS_TOKEN_URL = 'https://sts.googleapis.com/v1/token';
const IAM_CREDENTIALS_BASE_URL =
  'https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts';
const TOKEN_EXCHANGE_GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:token-exchange';
const ACCESS_TOKEN_TYPE = 'urn:ietf:params:oauth:token-type:access_token';
const JWT_TOKEN_TYPE = 'urn:ietf:params:oauth:token-type:jwt';
const CLOUD_PLATFORM_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';
const TOKEN_CACHE_TTL_MS = 50 * 60 * 1000;

let cachedIdToken: {
  key: string;
  token: string;
  expiresAtMs: number;
} | null = null;

export class GcpCvOcrOidcError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GcpCvOcrOidcError';
  }
}

export async function resolveGcpCvOcrOidcBearerToken(
  options: ResolveGcpCvOcrOidcTokenOptions
): Promise<string> {
  const config = options.config;
  const audience = config.oidcAudience ?? config.baseUrl;
  const cacheKey = [
    audience,
    config.oidcProjectNumber,
    config.oidcWorkloadIdentityPoolId,
    config.oidcWorkloadIdentityProviderId,
    config.oidcServiceAccountEmail,
  ].join('|');
  const nowMs = options.nowMs?.() ?? Date.now();

  if (cachedIdToken?.key === cacheKey && cachedIdToken.expiresAtMs > nowMs) {
    return cachedIdToken.token;
  }

  if (
    !audience ||
    !config.oidcProjectNumber ||
    !config.oidcWorkloadIdentityPoolId ||
    !config.oidcWorkloadIdentityProviderId ||
    !config.oidcServiceAccountEmail
  ) {
    throw new GcpCvOcrOidcError('GCP CV OCR OIDC configuration is incomplete.');
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const vercelOidcToken = await resolveVercelOidcToken(options.vercelOidcTokenFactory);
  if (!vercelOidcToken) {
    throw new GcpCvOcrOidcError('Vercel OIDC token is unavailable.');
  }

  const federatedAccessToken = await exchangeVercelTokenForGoogleAccessToken({
    audience:
      `//iam.googleapis.com/projects/${config.oidcProjectNumber}` +
      `/locations/global/workloadIdentityPools/${config.oidcWorkloadIdentityPoolId}` +
      `/providers/${config.oidcWorkloadIdentityProviderId}`,
    subjectToken: vercelOidcToken,
    fetchImpl,
  });
  const idToken = await generateCloudRunIdToken({
    accessToken: federatedAccessToken,
    audience,
    serviceAccountEmail: config.oidcServiceAccountEmail,
    fetchImpl,
  });

  cachedIdToken = {
    key: cacheKey,
    token: idToken,
    expiresAtMs: nowMs + TOKEN_CACHE_TTL_MS,
  };

  return idToken;
}

async function resolveVercelOidcToken(
  factory: VercelOidcTokenFactory | undefined
): Promise<string | null> {
  const explicitToken = await factory?.();
  if (explicitToken?.trim()) {
    return explicitToken.trim();
  }

  const envToken = process.env.VERCEL_OIDC_TOKEN?.trim();
  if (envToken) {
    return envToken;
  }

  try {
    const { headers } = await import('next/headers');
    const requestHeaders = await headers();
    return requestHeaders.get('x-vercel-oidc-token')?.trim() || null;
  } catch {
    return null;
  }
}

async function exchangeVercelTokenForGoogleAccessToken(params: {
  audience: string;
  subjectToken: string;
  fetchImpl: FetchLike;
}): Promise<string> {
  const body = new URLSearchParams({
    audience: params.audience,
    grant_type: TOKEN_EXCHANGE_GRANT_TYPE,
    requested_token_type: ACCESS_TOKEN_TYPE,
    scope: CLOUD_PLATFORM_SCOPE,
    subject_token: params.subjectToken,
    subject_token_type: JWT_TOKEN_TYPE,
  });
  const response = await params.fetchImpl(STS_TOKEN_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    throw new GcpCvOcrOidcError('Google STS token exchange failed.');
  }

  const payload = await safeJson(response);
  const accessToken =
    isRecord(payload) && typeof payload.access_token === 'string' ? payload.access_token : null;
  if (!accessToken) {
    throw new GcpCvOcrOidcError('Google STS token exchange returned an invalid response.');
  }

  return accessToken;
}

async function generateCloudRunIdToken(params: {
  accessToken: string;
  audience: string;
  serviceAccountEmail: string;
  fetchImpl: FetchLike;
}): Promise<string> {
  const response = await params.fetchImpl(
    `${IAM_CREDENTIALS_BASE_URL}/${encodeURIComponent(params.serviceAccountEmail)}:generateIdToken`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${params.accessToken}`,
        'content-type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        audience: params.audience,
        includeEmail: true,
      }),
    }
  );

  if (!response.ok) {
    throw new GcpCvOcrOidcError('Google ID token generation failed.');
  }

  const payload = await safeJson(response);
  const token = isRecord(payload) && typeof payload.token === 'string' ? payload.token : null;
  if (!token) {
    throw new GcpCvOcrOidcError('Google ID token generation returned an invalid response.');
  }

  return token;
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
