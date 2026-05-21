import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

describe('vercel-preflight', () => {
  it('supports GitHub Actions project secrets when the local Vercel link file is absent', () => {
    const script = fs.readFileSync(path.join(repoRoot, 'scripts/vercel-preflight.mjs'), 'utf8');

    expect(script).toContain("source: 'VERCEL_PROJECT_ID'");
    expect(script).toContain(
      '.vercel/project.json was not found and VERCEL_PROJECT_ID is not set.'
    );
    expect(script).toContain('process.env.VERCEL_PROJECT_ID');
    expect(script).toContain('Vercel project id resolves to');
  });

  it('keeps Vercel env preflight aligned with launch dependency requirements', () => {
    const script = fs.readFileSync(path.join(repoRoot, 'scripts/vercel-preflight.mjs'), 'utf8');

    expect(script).toContain("'RESEND_API_KEY'");
    expect(script).toContain("'KV_REST_API_URL'");
    expect(script).toContain("'KV_REST_API_TOKEN'");
    expect(script).toContain("'CRON_SECRET'");
  });

  it('rejects launch-bypass env keys from Vercel production and preview targets', () => {
    const script = fs.readFileSync(path.join(repoRoot, 'scripts/vercel-preflight.mjs'), 'utf8');

    expect(script).toContain('forbiddenEnvByTarget');
    expect(script).toContain('Forbidden ${target} env keys');
    expect(script).toContain("'PROOFOUND_SKIP_TRANSACTIONAL_EMAIL_DELIVERY'");
    expect(script).toContain("'PROOFOUND_LOCAL_SMOKE_RATE_LIMIT_FALLBACK'");
    expect(script).toContain("'PROOFOUND_LOCAL_SMOKE_ALLOW_INSECURE_CSRF_COOKIE'");
    expect(script).toContain("'DEBUG_INGEST_URL'");
    expect(script).toContain("'NEXT_PUBLIC_USE_MOCK_SUPABASE'");
    expect(script).toContain("'MOCK_ORG_MODE'");
  });
});
