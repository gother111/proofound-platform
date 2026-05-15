import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { OrgCandidatesWorkspace } from '@/components/organization/OrgCandidatesWorkspace';

vi.mock('@/app/app/o/[slug]/matching/DeferredOrgMatchingClient', () => ({
  DeferredOrgMatchingClient: () => <div data-testid="org-matching-page">OrgMatchingPage</div>,
}));

vi.mock('@/components/organization/OrgCandidateInvitesPanel', () => ({
  OrgCandidateInvitesPanel: () => <div data-testid="org-candidate-invites-panel">InvitesPanel</div>,
}));

vi.mock('@/components/ui/v2/AppSurface', () => ({
  AppSurface: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-surface">{children}</div>
  ),
}));

describe('OrgCandidatesWorkspace', () => {
  it('uses candidate review wording instead of marketplace framing', () => {
    render(<OrgCandidatesWorkspace orgId="org-1" />);

    expect(screen.getByRole('tab', { name: /candidate review/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /invited candidates/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /marketplace/i })).not.toBeInTheDocument();
    expect(
      screen.getByText(
        /assignment review and candidate context stay in one privacy-safe workspace for faster shortlisting\./i
      )
    ).toBeInTheDocument();
    expect(screen.getByTestId('org-matching-page')).toBeInTheDocument();
  });
});
