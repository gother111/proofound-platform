import { NextRequest } from 'next/server';

function getCronSecrets(): string[] {
  return [
    process.env.CRON_SECRET,
    process.env.CRON_SECRET_PREVIEW,
    process.env.NEXT_PUBLIC_CRON_SECRET,
  ].filter(Boolean) as string[];
}

export type CronAuthStatus = 'authorized' | 'unauthorized' | 'misconfigured';

export function getCronAuthStatus(request: NextRequest): CronAuthStatus {
  const authHeader = request.headers.get('authorization');
  const secrets = getCronSecrets();

  if (!secrets.length) {
    return 'misconfigured';
  }

  return secrets.some((secret) => authHeader === `Bearer ${secret}`)
    ? 'authorized'
    : 'unauthorized';
}

export function isAuthorizedCronRequest(request: NextRequest): boolean {
  return getCronAuthStatus(request) === 'authorized';
}
