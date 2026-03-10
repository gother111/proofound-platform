import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import OrganizationSettingsPage from '@/app/app/o/[slug]/settings/page';
import OrganizationIntegrationsSettingsPage from '@/app/app/o/[slug]/settings/integrations/page';

describe('organization non-MVP settings surfaces', () => {
  it('marks the main settings hub as gated for launch', async () => {
    const element = await OrganizationSettingsPage({
      params: Promise.resolve({ slug: 'acme' }),
    });

    render(element);

    expect(screen.getByText(/broad org settings are gated for launch/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open trust profile/i })).toHaveAttribute(
      'href',
      '/app/o/acme/profile'
    );
  });

  it('marks integrations as a non-MVP org surface', async () => {
    const element = await OrganizationIntegrationsSettingsPage({
      params: Promise.resolve({ slug: 'acme' }),
    });

    render(element);

    expect(screen.getByText(/integrations settings are gated for launch/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to overview/i })).toHaveAttribute(
      'href',
      '/app/o/acme/home'
    );
  });
});
