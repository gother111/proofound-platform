import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/cookies/CookieSettingsClient', () => ({
  CookieSettingsClient: ({ returnTo }: { returnTo: string }) => (
    <div data-testid="cookie-settings-client">{returnTo}</div>
  ),
}));

vi.mock('@/components/seo/JsonLdScripts', () => ({
  JsonLdScripts: () => null,
}));

vi.mock('@/lib/seo/json-ld', () => ({
  buildStaticPageJsonLd: () => [],
}));

vi.mock('@/lib/seo/public-metadata', () => ({
  buildPublicMetadata: () => ({}),
}));

import CookieSettingsPage from '@/app/cookies/settings/page';

describe('CookieSettingsPage', () => {
  it('sanitizes external return targets before rendering navigation', async () => {
    render(
      await CookieSettingsPage({
        searchParams: Promise.resolve({ returnTo: 'https://evil.example/collect' }),
      })
    );

    expect(screen.getByRole('link', { name: /Return to previous page/i })).toHaveAttribute(
      'href',
      '/'
    );
    expect(screen.getByTestId('cookie-settings-client')).toHaveTextContent('/');
  });

  it('preserves allowed in-app return targets', async () => {
    render(
      await CookieSettingsPage({
        searchParams: Promise.resolve({ returnTo: '/app/i/settings?tab=privacy' }),
      })
    );

    expect(screen.getByRole('link', { name: /Return to previous page/i })).toHaveAttribute(
      'href',
      '/app/i/settings?tab=privacy'
    );
    expect(screen.getByTestId('cookie-settings-client')).toHaveTextContent(
      '/app/i/settings?tab=privacy'
    );
  });
});
