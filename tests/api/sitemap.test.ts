import { beforeEach, describe, expect, it, vi } from 'vitest';

const { executeMock, warnMock } = vi.hoisted(() => ({
  executeMock: vi.fn(),
  warnMock: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    execute: executeMock,
  },
}));

vi.mock('@/lib/db/rows', () => ({
  getRows: <T,>(result: { rows?: T[] }) => result.rows ?? [],
}));

vi.mock('@/lib/db/schemaCompatibility', () => ({
  isSchemaCompatibilityError: () => false,
}));

vi.mock('@/lib/log', () => ({
  log: {
    warn: warnMock,
  },
}));

import sitemap from '@/app/sitemap';

describe('sitemap launch surfaces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeMock
      .mockResolvedValueOnce({
        rows: [{ handle: 'alex', updated_at: '2026-03-20T00:00:00.000Z' }],
      })
      .mockResolvedValueOnce({
        rows: [{ slug: 'acme', updated_at: '2026-03-21T00:00:00.000Z' }],
      });
  });

  it('excludes archived marketing pages and keeps the launch-safe allowlist', async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain('https://proofound.io/');
    expect(urls).toContain('https://proofound.io/login');
    expect(urls).toContain('https://proofound.io/auth/login');
    expect(urls).toContain('https://proofound.io/signup');
    expect(urls).toContain('https://proofound.io/onboarding');
    expect(urls).toContain('https://proofound.io/privacy');
    expect(urls).toContain('https://proofound.io/terms');
    expect(urls).toContain('https://proofound.io/cookies');
    expect(urls).toContain('https://proofound.io/cookies/settings');
    expect(urls).toContain('https://proofound.io/portfolio/alex');
    expect(urls).toContain('https://proofound.io/portfolio/org/acme');

    expect(urls).not.toContain('https://proofound.io/about');
    expect(urls).not.toContain('https://proofound.io/manifesto');
    expect(urls).not.toContain('https://proofound.io/careers');
    expect(urls).not.toContain('https://proofound.io/contact');
    expect(urls).not.toContain('https://proofound.io/support');
  });
});
