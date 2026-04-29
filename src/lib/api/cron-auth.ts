import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

const MIN_INTERNAL_SECRET_LENGTH = 16;
const INVALID_SECRET_VALUES = new Set(['undefined', 'null']);

export type CronAuthStatus = 'authorized' | 'unauthorized' | 'misconfigured';

export function normalizeInternalSecret(value: string | undefined): string | null {
  const secret = value?.trim();

  if (!secret) return null;
  if (INVALID_SECRET_VALUES.has(secret.toLowerCase())) return null;
  if (secret.length < MIN_INTERNAL_SECRET_LENGTH) return null;

  return secret;
}

export function getServerOnlyInternalSecrets(): string[] {
  return [
    process.env.INTERNAL_API_SECRET,
    process.env.CRON_SECRET,
    process.env.CRON_SECRET_PREVIEW,
  ].flatMap((value) => {
    const secret = normalizeInternalSecret(value);
    return secret ? [secret] : [];
  });
}

export function getPrimaryServerOnlyInternalSecret(): string {
  return getServerOnlyInternalSecrets()[0] ?? '';
}

function safeSecretEquals(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

function getPresentedSecrets(request: Request): string[] {
  const authorization = request.headers.get('authorization')?.trim();
  const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const internalApiKey = request.headers.get('x-internal-api-key')?.trim();

  return [bearerToken, internalApiKey].flatMap((value) => (value ? [value] : []));
}

export function getCronAuthStatus(request: Request): CronAuthStatus {
  const secrets = getServerOnlyInternalSecrets();

  if (!secrets.length) {
    return 'misconfigured';
  }

  const presentedSecrets = getPresentedSecrets(request);

  return secrets.some((secret) =>
    presentedSecrets.some((presentedSecret) => safeSecretEquals(presentedSecret, secret))
  )
    ? 'authorized'
    : 'unauthorized';
}

export function isAuthorizedCronRequest(request: Request): boolean {
  return getCronAuthStatus(request) === 'authorized';
}

export function requireInternalOpsRequest(request: Request): NextResponse | null {
  const status = getCronAuthStatus(request);

  if (status === 'authorized') {
    return null;
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function archivedCronResponse(message: string): NextResponse {
  return NextResponse.json(
    {
      error: 'Cron route archived',
      message,
    },
    { status: 410 }
  );
}
