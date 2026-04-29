/**
 * Health Check API Endpoint
 *
 * Public liveness endpoint. Keep the payload intentionally small; internal
 * diagnostics live behind authenticated launch-ops routes.
 */

import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db-health-check';
import { getEnv, isMockSupabaseEnabled } from '@/lib/env';

export const dynamic = 'force-dynamic';

type PublicHealthStatus = 'ok' | 'degraded';

async function getPublicHealthStatus(): Promise<PublicHealthStatus> {
  const env = getEnv(false);
  const mockMode = isMockSupabaseEnabled();
  const dbHealthy = mockMode ? true : await checkDatabaseHealth();
  const configured = Boolean(env.SUPABASE_URL && env.SITE_URL && (env.DATABASE_URL || mockMode));

  return dbHealthy && configured ? 'ok' : 'degraded';
}

export async function GET() {
  try {
    const status = await getPublicHealthStatus();

    return NextResponse.json(
      {
        status,
        timestamp: new Date().toISOString(),
      },
      { status: status === 'ok' ? 200 : 503 }
    );
  } catch {
    return NextResponse.json(
      {
        status: 'degraded',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
