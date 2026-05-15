import { NextResponse } from 'next/server';

import { requireInternalOpsRequest } from '@/lib/api/cron-auth';
import { getDatabaseStatus } from '@/lib/db-health-check';
import { getEnabledMockDatabaseModes, getEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

type HealthDiagnosticsStatus = 'ok' | 'degraded';

const DEPLOYMENT_ENV_KEYS = ['VERCEL_ENV', 'NODE_ENV', 'NEXT_PUBLIC_APP_ENV', 'APP_ENV'] as const;

function getCommitSha() {
  return process.env.VERCEL_GIT_COMMIT_SHA?.trim() || process.env.GIT_COMMIT_SHA?.trim() || null;
}

function getDeploymentPosture() {
  return {
    commitSha: getCommitSha(),
    vercelEnv: process.env.VERCEL_ENV?.trim() || null,
    nodeEnv: process.env.NODE_ENV?.trim() || null,
    deploymentEnvKeysPresent: DEPLOYMENT_ENV_KEYS.filter((key) => Boolean(process.env[key])),
  };
}

function getEnvironmentPresence() {
  try {
    const env = getEnv(false);

    return {
      ok: Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY && env.DATABASE_URL && env.SITE_URL),
      error: null,
      required: {
        supabaseUrl: Boolean(env.SUPABASE_URL),
        supabaseAnonKey: Boolean(env.SUPABASE_ANON_KEY),
        databaseUrl: Boolean(env.DATABASE_URL),
        siteUrl: Boolean(env.SITE_URL),
      },
      optional: {
        supabaseServiceRoleKey: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown environment validation error',
      required: {
        supabaseUrl: false,
        supabaseAnonKey: false,
        databaseUrl: false,
        siteUrl: false,
      },
      optional: {
        supabaseServiceRoleKey: false,
      },
    };
  }
}

export async function GET(request: Request) {
  const unauthorized = requireInternalOpsRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const [database, mockDatabaseModes] = await Promise.all([
      getDatabaseStatus(),
      Promise.resolve(getEnabledMockDatabaseModes()),
    ]);
    const environment = getEnvironmentPresence();
    const warnings = [
      ...(database.healthy ? [] : ['database_unavailable']),
      ...(environment.ok ? [] : ['environment_misconfigured']),
      ...(mockDatabaseModes.length > 0 ? ['mock_database_mode_enabled'] : []),
    ];
    const status: HealthDiagnosticsStatus = warnings.length === 0 ? 'ok' : 'degraded';

    return NextResponse.json(
      {
        ok: status === 'ok',
        status,
        timestamp: new Date().toISOString(),
        database,
        environment,
        mockDatabaseModes,
        warnings,
        deployment: getDeploymentPosture(),
      },
      { status: status === 'ok' ? 200 : 503 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: 'degraded',
        timestamp: new Date().toISOString(),
        error: 'Failed to load health diagnostics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
