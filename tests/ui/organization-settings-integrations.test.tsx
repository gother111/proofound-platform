import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

import OrganizationSettingsPage from '@/app/app/o/[slug]/settings/page';
import OrganizationIntegrationsSettingsPage from '@/app/app/o/[slug]/settings/integrations/page';

describe('organization non-MVP settings surfaces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks the main settings hub as gated for launch', async () => {
    const element = await OrganizationSettingsPage({
      params: Promise.resolve({ slug: 'acme' }),
    });

    render(element);

    expect(screen.getByText(/broad org settings are gated for launch/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open organization profile/i })).toHaveAttribute(
      'href',
      '/app/o/acme/profile'
    );
  });

  it('redirects integrations subpage to the launch-safe org fallback', async () => {
    await expect(
      OrganizationIntegrationsSettingsPage({
        params: Promise.resolve({ slug: 'acme' }),
      })
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(redirectMock).toHaveBeenCalledWith('/app/o/acme/home');
  });
});
