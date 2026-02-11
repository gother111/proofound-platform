import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  getMissingPrivacyEnvVars,
  loadPrivacyEnv,
  PRIVACY_REQUIRED_ENV_KEYS,
} from '@/lib/testing/privacy-env-loader';

const ORIGINAL_ENV = { ...process.env };
const tempDirs: string[] = [];

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  for (const dir of tempDirs.splice(0, tempDirs.length)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function createTempDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'privacy-env-loader-'));
  tempDirs.push(dir);
  return dir;
}

describe('privacy env loader', () => {
  it('prefers .env.test when it exists', () => {
    const cwd = createTempDir();
    process.env = {};
    fs.writeFileSync(
      path.join(cwd, '.env.test'),
      [
        'NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-key',
        'SUPABASE_SERVICE_ROLE_KEY=service-role',
      ].join('\n')
    );
    fs.writeFileSync(
      path.join(cwd, '.env.local'),
      'NEXT_PUBLIC_SUPABASE_URL=https://local.supabase.co'
    );

    const result = loadPrivacyEnv(cwd);

    expect(result.source).toBe('.env.test');
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test.supabase.co');
  });

  it('falls back to .env.local when .env.test is absent', () => {
    const cwd = createTempDir();
    process.env = {};
    fs.writeFileSync(
      path.join(cwd, '.env.local'),
      'NEXT_PUBLIC_SUPABASE_URL=https://local.supabase.co'
    );

    const result = loadPrivacyEnv(cwd);

    expect(result.source).toBe('.env.local');
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://local.supabase.co');
  });

  it('reports process-env when no env files exist', () => {
    const cwd = createTempDir();
    const result = loadPrivacyEnv(cwd);
    expect(result.source).toBe('process-env');
  });

  it('reports missing required variables explicitly', () => {
    const env: NodeJS.ProcessEnv = {
      NEXT_PUBLIC_SUPABASE_URL: 'https://x.supabase.co',
    };

    const missing = getMissingPrivacyEnvVars(env);
    const expected = PRIVACY_REQUIRED_ENV_KEYS.filter((key) => !env[key]);
    expect(missing).toEqual(expected);
  });
});
