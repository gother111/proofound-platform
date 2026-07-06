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
  getRows: <T>(result: { rows?: T[] }) => result.rows ?? [],
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

function expectedSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    'https://proofound.io'
  ).replace(/\/$/, '');
}

describe('sitemap launch surfaces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeMock.mockResolvedValueOnce({
      rows: [{ slug: 'acme', updated_at: '2026-03-21T00:00:00.000Z' }],
    });
  });

  it('excludes archived marketing pages and keeps the launch-safe allowlist', async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);
    const siteUrl = expectedSiteUrl();

    expect(urls).toContain(`${siteUrl}/`);
    expect(urls).toContain(`${siteUrl}/login`);
    expect(urls).not.toContain(`${siteUrl}/auth/login`);
    expect(urls).toContain(`${siteUrl}/signup`);
    expect(urls).toContain(`${siteUrl}/onboarding`);
    expect(urls).toContain(`${siteUrl}/privacy`);
    expect(urls).toContain(`${siteUrl}/terms`);
    expect(urls).toContain(`${siteUrl}/cookies`);
    expect(urls).toContain(`${siteUrl}/cookies/settings`);
    expect(urls).toContain(`${siteUrl}/portfolio/org/acme`);
    expect(urls).not.toContain(`${siteUrl}/portfolio/alex`);

    expect(urls).not.toContain(`${siteUrl}/about`);
    expect(urls).not.toContain(`${siteUrl}/manifesto`);
    expect(urls).not.toContain(`${siteUrl}/careers`);
    expect(urls).not.toContain(`${siteUrl}/contact`);
    expect(urls).not.toContain(`${siteUrl}/support`);
  });
});
