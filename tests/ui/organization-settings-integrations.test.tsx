import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OrganizationSettingsPage from '@/app/app/o/[slug]/settings/page';
import OrganizationIntegrationsSettingsPage from '@/app/app/o/[slug]/settings/integrations/page';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrg, requireAuth } from '@/lib/auth';

const { redirectMock, notFoundMock, videoManagerPropsMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
  notFoundMock: vi.fn(() => {
    throw new Error('NOT_FOUND');
  }),
  videoManagerPropsMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
  notFound: notFoundMock,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
  getActiveOrg: vi.fn(),
}));

vi.mock('@/components/settings/VideoIntegrationsManager', () => ({
  VideoIntegrationsManager: (props: any) => {
    videoManagerPropsMock(props);
    return <div data-testid="video-integrations-manager" data-returnto={props.returnTo} />;
  },
}));

function buildAuditLogsSupabase() {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
  };

  return {
    from: vi.fn(() => query),
  };
}

describe('organization settings integrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue({ id: 'user-1' } as any);
    vi.mocked(getActiveOrg).mockResolvedValue({
      org: {
        id: 'org-1',
        displayName: 'Acme Org',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      membership: { role: 'owner' },
    } as any);
    vi.mocked(createClient).mockResolvedValue(buildAuditLogsSupabase() as any);
  });

  it('shows Integrations entry in org settings hub', async () => {
    const element = await OrganizationSettingsPage({
      params: Promise.resolve({ slug: 'acme' }),
    });

    render(element);

    expect(screen.getByRole('link', { name: /integrations/i })).toHaveAttribute(
      'href',
      '/app/o/acme/settings/integrations'
    );
  });

  it('renders video integrations manager with org return path', async () => {
    const element = await OrganizationIntegrationsSettingsPage({
      params: Promise.resolve({ slug: 'acme' }),
    });

    render(element);

    expect(screen.getByTestId('video-integrations-manager')).toBeInTheDocument();
    expect(videoManagerPropsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'standalone',
        returnTo: '/app/o/acme/settings/integrations',
      })
    );
  });
});
