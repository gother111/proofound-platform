import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';

const requiredEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  NEXT_PUBLIC_SITE_URL: 'https://proofound.example',
  DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
  KV_REST_API_URL: 'https://kv.example.test',
  KV_REST_API_TOKEN: 'kv-token',
  RESEND_API_KEY: 're_test_key',
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

  it('fails production deploy readiness when rate limiting is not configured', () => {
    const result = runReadiness({
      ...requiredEnv,
      NODE_ENV: 'production',
      KV_REST_API_URL: '',
      KV_REST_API_TOKEN: '',
    });

    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain('KV_REST_API_URL');
    expect(`${result.stdout}${result.stderr}`).toContain('KV_REST_API_TOKEN');
  });

  it('fails staging deploy readiness when rate limiting is not configured', () => {
    const result = runReadiness({
      ...requiredEnv,
      VERCEL_ENV: 'preview',
      KV_REST_API_TOKEN: '',
    });

    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain('KV_REST_API_TOKEN');
  });

  it('fails strict readiness when transactional email provider config is missing', () => {
    const result = runReadiness({
      ...requiredEnv,
      FORCE_STRICT_DEPLOY_CHECK: 'true',
      RESEND_API_KEY: '',
    });

    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain('RESEND_API_KEY');
  });

  it('fails strict readiness when mock Supabase is enabled', () => {
    const result = runReadiness({
      ...requiredEnv,
      NODE_ENV: 'development',
      FORCE_STRICT_DEPLOY_CHECK: 'true',
      NEXT_PUBLIC_USE_MOCK_SUPABASE: 'true',
      MOCK_ORG_MODE: 'true',
    });

    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain('NEXT_PUBLIC_USE_MOCK_SUPABASE');
    expect(`${result.stdout}${result.stderr}`).toContain('MOCK_ORG_MODE');
  });

  it('fails strict readiness when transactional email delivery is skipped', () => {
    const result = runReadiness({
      ...requiredEnv,
      FORCE_STRICT_DEPLOY_CHECK: 'true',
      PROOFOUND_SKIP_TRANSACTIONAL_EMAIL_DELIVERY: '1',
    });

    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain(
      'PROOFOUND_SKIP_TRANSACTIONAL_EMAIL_DELIVERY'
    );
  });

  it('fails strict readiness when debug ingest sinks are configured', () => {
    const result = runReadiness({
      ...requiredEnv,
      FORCE_STRICT_DEPLOY_CHECK: 'true',
      DEBUG_INGEST_ENABLED: 'true',
      DEBUG_INGEST_URL: 'https://debug.example/ingest',
      NEXT_PUBLIC_DEBUG_INGEST_URL: 'https://debug-public.example/ingest',
    });

    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain('DEBUG_INGEST_ENABLED');
    expect(`${result.stdout}${result.stderr}`).toContain('DEBUG_INGEST_URL');
    expect(`${result.stdout}${result.stderr}`).toContain('NEXT_PUBLIC_DEBUG_INGEST_URL');
  });

  it('fails strict readiness when AI provider secrets are exposed as public env vars', () => {
    const result = runReadiness({
      ...requiredEnv,
      FORCE_STRICT_DEPLOY_CHECK: 'true',
      NEXT_PUBLIC_OPENAI_API_KEY: 'browser-openai-secret',
      NEXT_PUBLIC_ANTHROPIC_API_TOKEN: 'browser-anthropic-secret',
    });

    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain('NEXT_PUBLIC_OPENAI_API_KEY');
    expect(`${result.stdout}${result.stderr}`).toContain('NEXT_PUBLIC_ANTHROPIC_API_TOKEN');
    expect(`${result.stdout}${result.stderr}`).toContain(
      'Strict deploy checks must not configure client-exposed AI provider secrets'
    );
  });

  it('fails live deploy readiness when local smoke fallbacks are enabled', () => {
    const result = runReadiness({
      ...requiredEnv,
      VERCEL_ENV: 'preview',
      PROOFOUND_LOCAL_SMOKE_RATE_LIMIT_FALLBACK: '1',
      PROOFOUND_LOCAL_SMOKE_ALLOW_INSECURE_CSRF_COOKIE: '1',
    });

    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain(
      'PROOFOUND_LOCAL_SMOKE_RATE_LIMIT_FALLBACK'
    );
    expect(`${result.stdout}${result.stderr}`).toContain(
      'PROOFOUND_LOCAL_SMOKE_ALLOW_INSECURE_CSRF_COOKIE'
    );
  });

  it('allows strict local readiness to keep local smoke fallbacks for local parity gates', () => {
    const result = runReadiness({
      ...requiredEnv,
      FORCE_STRICT_DEPLOY_CHECK: 'true',
      PROOFOUND_LOCAL_SMOKE_RATE_LIMIT_FALLBACK: '1',
      PROOFOUND_LOCAL_SMOKE_ALLOW_INSECURE_CSRF_COOKIE: '1',
    });

    expect(result.status).toBe(0);
  });
});
