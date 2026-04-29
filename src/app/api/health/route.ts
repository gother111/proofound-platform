/**
 * Health Check API Endpoint
 *
 * Public liveness endpoint. Keep the payload intentionally small; internal
 * diagnostics live behind authenticated launch-ops routes.
 */

import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db-health-check';
import { getEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const env = getEnv(false);
    const dbHealthy = await checkDatabaseHealth();

    const allHealthy = dbHealthy && !!env.SUPABASE_URL && !!env.DATABASE_URL && !!env.SITE_URL;

    return NextResponse.json({
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
    });
  } catch (error) {
    // If health check itself fails, return error status
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        version: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
      },
      { status: 503 }
    );
  }
}
