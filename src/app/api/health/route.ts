/**
 * Health Check API Endpoint
 * 
 * GET /api/health
 * 
 * Returns the health status of the application, including:
 * - Database connectivity
 * - Environment variable configuration
 * - Supabase connection status
 * 
 * Use this endpoint to quickly diagnose production issues.
 */

import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db-health-check';
import { getEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get environment configuration (non-strict mode to avoid throwing)
    const env = getEnv(false);
    
    // Check database health
    const dbHealthy = await checkDatabaseHealth();
    
    // Determine overall status
    const allHealthy = dbHealthy && !!env.SUPABASE_URL && !!env.DATABASE_URL && !!env.SITE_URL;
    
    return NextResponse.json({
      status: allHealthy ? 'healthy' : 'degraded',
      database: {
        connected: dbHealthy,
        usingMockDb: !env.DATABASE_URL,
      },
      environment: {
        hasSupabaseUrl: !!env.SUPABASE_URL,
        hasSupabaseAnonKey: !!env.SUPABASE_ANON_KEY,
        hasDatabaseUrl: !!env.DATABASE_URL,
        hasSiteUrl: !!env.SITE_URL,
        hasServiceRoleKey: !!env.SUPABASE_SERVICE_ROLE_KEY,
      },
      warnings: [
        ...(!env.DATABASE_URL ? ['DATABASE_URL is missing - using mock database'] : []),
        ...(!env.SUPABASE_URL ? ['SUPABASE_URL is missing'] : []),
        ...(!env.SITE_URL ? ['SITE_URL is missing'] : []),
      ],
      timestamp: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
    });
  } catch (error) {
    // If health check itself fails, return error status
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

