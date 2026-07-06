import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiFetchMock = vi.fn();

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

describe('OrgCandidateInvitesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('puts the first applicant invite CTA at the center of an empty queue', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        invites: [],
        permissions: { canManage: true },
      }),
    });

    const { OrgCandidateInvitesPanel } = await import(
      '@/components/organization/OrgCandidateInvitesPanel'
    );

    render(<OrgCandidateInvitesPanel orgId="org-1" />);

    const inviteCta = await screen.findByRole('button', {
      name: /invite your first applicant/i,
    });
    expect(inviteCta).toHaveTextContent(
      "Invite your first applicant — they'll answer with structured proof instead of a CV"
    );
    expect(screen.getByText(/candidate submissions will appear here/i)).toBeInTheDocument();

    fireEvent.click(inviteCta);

    await waitFor(() => {
      expect(screen.getByLabelText(/invite candidate emails/i)).toHaveFocus();
    });
  });

  it('keeps filtered zero-result copy separate from the first-invite CTA', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        invites: [
          {
            id: 'invite-1',
            inviteeEmail: 'candidate@example.com',
            status: 'pending',
            expiresAt: '2026-08-01T00:00:00.000Z',
            invitedBy: 'user-1',
            claimedByProfileId: null,
            claimedAt: null,
            proofSnippetId: null,
            proofSubmittedAt: null,
            revokedAt: null,
            createdAt: '2026-07-01T00:00:00.000Z',
            updatedAt: '2026-07-01T00:00:00.000Z',
            claimedProfileHandle: null,
            claimedProfileName: null,
          },
        ],
        permissions: { canManage: true },
      }),
    });

    const { OrgCandidateInvitesPanel } = await import(
      '@/components/organization/OrgCandidateInvitesPanel'
    );

    render(<OrgCandidateInvitesPanel orgId="org-1" />);

    await screen.findByText('candidate@example.com');
    fireEvent.change(screen.getByLabelText(/^status$/i), {
      target: { value: 'proof_submitted' },
    });

    expect(screen.getByText(/no candidates found/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /invite your first applicant/i })).toBeNull();
  });

  it('renders proof-submitted invite rows as submitted workspace entries', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        invites: [
          {
            id: 'invite-1',
            inviteeEmail: 'submitted@example.com',
            status: 'proof_submitted',
            expiresAt: '2026-08-01T00:00:00.000Z',
            invitedBy: 'user-1',
            claimedByProfileId: 'candidate-1',
            claimedAt: '2026-07-02T00:00:00.000Z',
            proofSnippetId: 'proof-1',
            proofSubmittedAt: '2026-07-03T00:00:00.000Z',
            revokedAt: null,
            createdAt: '2026-07-01T00:00:00.000Z',
            updatedAt: '2026-07-03T00:00:00.000Z',
            claimedProfileHandle: 'submitted-candidate',
            claimedProfileName: 'Submitted Candidate',
          },
        ],
        permissions: { canManage: true },
      }),
    });

    const { OrgCandidateInvitesPanel } = await import(
      '@/components/organization/OrgCandidateInvitesPanel'
    );

    render(<OrgCandidateInvitesPanel orgId="org-1" />);

    expect(await screen.findByText('submitted@example.com')).toBeInTheDocument();
    expect(screen.getByText('Proof submitted', { selector: 'div' })).toBeInTheDocument();
    expect(screen.getByText(/submitted candidate/i)).toBeInTheDocument();
    expect(screen.getByText(/^Submitted:/i)).not.toHaveTextContent('No');
  });
});
