import { describe, expect, it } from 'vitest';

import { buildPostgresConnectionOptions } from '@/db/postgres-options';

describe('buildPostgresConnectionOptions', () => {
  it('keeps local development connections out of reconnect lifecycle churn', () => {
    const options = buildPostgresConnectionOptions({
      NODE_ENV: 'development',
      VERCEL_ENV: '',
      NEXT_PUBLIC_APP_ENV: '',
      APP_ENV: '',
    });

    expect(options).not.toHaveProperty('idle_timeout');
    expect(options.max_lifetime).toBeNull();
    expect(options.ssl).toBe(false);
    expect(options.prepare).toBe(false);
  });

  it('keeps bounded connection lifecycles for production deploy runtimes', () => {
    expect(
      buildPostgresConnectionOptions({
        NODE_ENV: 'production',
        VERCEL_ENV: 'production',
      })
    ).toEqual({
      idle_timeout: 10,
      max_lifetime: 60 * 30,
      ssl: 'require',
      prepare: false,
    });
  });

  it('treats preview and staging deploy contexts as production-like for connection lifecycles', () => {
    expect(
      buildPostgresConnectionOptions({
        NODE_ENV: 'test',
        VERCEL_ENV: 'preview',
      })
    ).toMatchObject({
      idle_timeout: 10,
      max_lifetime: 60 * 30,
      ssl: false,
    });

    expect(
      buildPostgresConnectionOptions({
        NODE_ENV: 'test',
        VERCEL_ENV: '',
        NEXT_PUBLIC_APP_ENV: 'staging',
      })
    ).toMatchObject({
      idle_timeout: 10,
      max_lifetime: 60 * 30,
      ssl: false,
    });
  });
});
