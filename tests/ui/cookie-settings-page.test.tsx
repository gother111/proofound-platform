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

  it('explains privacy-safe defaults before granular controls', async () => {
    render(
      await CookieSettingsPage({
        searchParams: Promise.resolve({}),
      })
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Privacy-safe defaults' })
    ).toBeInTheDocument();
    expect(screen.getByText(/Essential only by default/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Optional analytics and marketing cookies stay off/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Change or withdraw prior choices/i)).toBeInTheDocument();
    expect(screen.queryByText(/GDPR regulations/i)).not.toBeInTheDocument();
  });
});
