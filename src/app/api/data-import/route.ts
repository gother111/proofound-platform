import { NextRequest } from 'next/server';
import { POST as postCanonicalUserImport } from '@/app/api/user/import/route';
import { addDeprecationHeaders } from '@/lib/api/deprecation';

const CanonicalPath = '/api/user/import';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rawBody = await request.json().catch(() => ({}));
  const body =
    rawBody && typeof rawBody === 'object' && !('consentAcknowledged' in rawBody)
      ? { ...(rawBody as Record<string, unknown>), consentAcknowledged: true }
      : rawBody;

  const canonicalRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify(body),
  });

  const response = await postCanonicalUserImport(canonicalRequest);
  return addDeprecationHeaders(response, CanonicalPath);
}
