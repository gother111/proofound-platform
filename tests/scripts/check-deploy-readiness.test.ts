import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';

const requiredEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  NEXT_PUBLIC_SITE_URL: 'https://proofound.example',
  DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
};

function runReadiness(env: NodeJS.ProcessEnv) {
  return spawnSync(process.execPath, ['scripts/check-deploy-readiness.mjs'], {
    cwd: process.cwd(),
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      ...env,
    },
    encoding: 'utf8',
  });
}

describe('check-deploy-readiness', () => {
  it('fails production deploy readiness when mock Supabase is enabled', () => {
    const result = runReadiness({
      ...requiredEnv,
      NODE_ENV: 'production',
      NEXT_PUBLIC_USE_MOCK_SUPABASE: 'true',
    });

    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain('NEXT_PUBLIC_USE_MOCK_SUPABASE');
  });

  it('fails strict readiness when the service role key is missing', () => {
    const result = runReadiness({
      ...requiredEnv,
      FORCE_STRICT_DEPLOY_CHECK: 'true',
      SUPABASE_SERVICE_ROLE_KEY: '',
    });

    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain('SUPABASE_SERVICE_ROLE_KEY');
  });

  it('allows mock Supabase during non-production development readiness checks', () => {
    const result = runReadiness({
      ...requiredEnv,
      NODE_ENV: 'development',
      FORCE_STRICT_DEPLOY_CHECK: 'true',
      NEXT_PUBLIC_USE_MOCK_SUPABASE: 'true',
    });

    expect(result.status).toBe(0);
  });
});
