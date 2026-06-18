import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CandidateInviteClient } from '@/app/candidate-invite/[token]/CandidateInviteClient';
import { apiFetch } from '@/lib/api/fetch';

const { dispatchClientDiagnosticMock, dispatchClientErrorDiagnosticMock } = vi.hoisted(() => ({
  dispatchClientDiagnosticMock: vi.fn(),
  dispatchClientErrorDiagnosticMock: vi.fn(),
}));

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientDiagnostic: dispatchClientDiagnosticMock,
  dispatchClientErrorDiagnostic: dispatchClientErrorDiagnosticMock,
}));

const apiFetchMock = vi.mocked(apiFetch);

const structuredAssignment = {
  id: 'assignment-1',
  role: 'Designer',
  description: 'Shape a proof-led onboarding corridor for external candidates.',
  status: 'active',
  createdAt: new Date().toISOString(),
  engagementType: 'contract_consulting',
  businessValue: 'Improve submission review quality before the first conversation.',
  expectedImpact: 'Submit one work artifact that shows ownership, outcomes, and constraints.',
  mustHaveSkills: [{ label: 'Service design', level: 4 }],
  locationMode: 'remote',
  city: 'Stockholm',
  country: 'Sweden',
  hoursMin: 12,
  hoursMax: 20,
  startEarliest: '2026-06-01',
  startLatest: '2026-06-15',
  verificationGates: ['identity', 'work_email'],
};

const availableProofPack = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Service design proof pack',
  summary: 'One owner-only proof pack for this assignment.',
  evidenceSummary: 'Private evidence stays in the assignment packet.',
  outcomesSummary: null,
  verificationSummary: null,
  updatedAt: new Date().toISOString(),
};

function renderClaimedProofCardInvite() {
  render(
    <CandidateInviteClient
      token="token-value"
      initialState={{
        invite: {
          id: 'invite-1',
          status: 'claimed',
          flowType: 'proof_card',
          assignmentId: 'assignment-1',
          maskedEmail: 'ca***@example.com',
          expiresAt: new Date(Date.now() + 3600_000).toISOString(),
          claimedAt: new Date().toISOString(),
          claimedByCurrentUser: true,
          acceptedAt: null,
          acceptedByCurrentUser: false,
          communicationsUrl: null,
          proofSubmittedAt: null,
        },
        organization: {
          id: 'org-1',
          slug: 'acme',
          displayName: 'Acme Org',
          logoUrl: null,
        },
        assignment: structuredAssignment,
        currentUser: {
          id: 'user-1',
          email: 'candidate@example.com',
        },
        availableProofPacks: [availableProofPack],
      }}
    />
  );
}

describe('CandidateInviteClient test_match flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders test-flow accepted CTAs with messaging link', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url === '/api/candidate-invites/token-value') {
        return {
          ok: true,
          json: async () => ({
            invite: {
              id: 'invite-1',
              status: 'claimed',
              flowType: 'test_match',
              assignmentId: 'assignment-1',
              maskedEmail: 'ca***@example.com',
              expiresAt: new Date(Date.now() + 3600_000).toISOString(),
              claimedAt: new Date().toISOString(),
              claimedByCurrentUser: true,
              acceptedAt: new Date().toISOString(),
              acceptedByCurrentUser: true,
              communicationsUrl:
                '/app/i/communications?section=messages&conversation=conversation-1',
              proofSubmittedAt: null,
            },
            organization: {
              id: 'org-1',
              slug: 'acme',
              displayName: 'Acme Org',
              logoUrl: null,
            },
            assignment: {
              id: 'assignment-1',
              role: 'Designer',
              description: 'Shape a proof-led onboarding corridor for external candidates.',
              status: 'active',
              createdAt: new Date().toISOString(),
            },
          }),
        };
      }

      if (url === '/api/user/me') {
        return {
          ok: true,
          json: async () => ({
            id: 'user-1',
            email: 'candidate@example.com',
          }),
        };
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock as any);

    render(<CandidateInviteClient token="token-value" />);

    await waitFor(() => {
      expect(screen.getByText(/assignment review invite accepted/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/trial match/i)).not.toBeInTheDocument();

    expect(screen.getByRole('link', { name: /open communications/i })).toHaveAttribute(
      'href',
      '/app/i/communications?section=messages&conversation=conversation-1'
    );
  });

  it('keeps proof-card invite submission assignment-specific without purpose, CV, ranking, or directory drift', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url === '/api/candidate-invites/token-value') {
        return {
          ok: true,
          json: async () => ({
            invite: {
              id: 'invite-1',
              status: 'claimed',
              flowType: 'proof_card',
              assignmentId: 'assignment-1',
              maskedEmail: 'ca***@example.com',
              expiresAt: new Date(Date.now() + 3600_000).toISOString(),
              claimedAt: new Date().toISOString(),
              claimedByCurrentUser: true,
              acceptedAt: null,
              acceptedByCurrentUser: false,
              communicationsUrl: null,
              proofSubmittedAt: null,
            },
            organization: {
              id: 'org-1',
              slug: 'acme',
              displayName: 'Acme Org',
              logoUrl: null,
            },
            assignment: structuredAssignment,
            availableProofPacks: [
              {
                id: '11111111-1111-4111-8111-111111111111',
                title: 'Service design proof pack',
                summary: 'One owner-only proof pack for this assignment.',
                evidenceSummary: null,
                outcomesSummary: null,
                verificationSummary: null,
                updatedAt: new Date().toISOString(),
              },
            ],
          }),
        };
      }

      if (url === '/api/user/me') {
        return {
          ok: true,
          json: async () => ({
            id: 'user-1',
            email: 'candidate@example.com',
          }),
        };
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    apiFetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/candidate-invites/token-value/proof-card') {
        return {
          ok: true,
          json: async () => ({ success: true }),
        } as Response;
      }

      throw new Error(`Unexpected apiFetch URL: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock as any);

    render(<CandidateInviteClient token="token-value" />);

    await waitFor(() => {
      expect(screen.getByText(/submit assignment-specific proof/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Assignment: Designer/i)).toBeInTheDocument();
    expect(screen.getByText(/Improve submission review quality/i)).toBeInTheDocument();
    expect(screen.getByText(/Submit one work artifact/i)).toBeInTheDocument();
    expect(screen.getByText(/Remote \/ Stockholm, Sweden/i)).toBeInTheDocument();
    expect(screen.getByText(/Identity check/i)).toBeInTheDocument();
    expect(screen.getByText(/Work email check/i)).toBeInTheDocument();
    expect(screen.getByText(/Private review first/i)).toBeInTheDocument();
    expect(
      screen.getByText(/does not publish your Public Page or broaden visibility/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId('candidate-proof-submission-path')).toHaveTextContent(
      /Build proof.*Attach evidence.*Review privacy/i
    );
    expect(screen.getByText(/Minimum submission packet/i)).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/00000000-0000-0000-0000-000000000000/)
    ).not.toBeInTheDocument();
    const visibleText = document.body.textContent ?? '';
    expect(visibleText).not.toMatch(/cv import|resume|public directory|people search|searchable/i);
    expect(visibleText).not.toMatch(/values|causes|mission-first|purpose-fit/i);
    expect(screen.queryByRole('button', { name: /score|rank|shortlist/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /cv import|resume|people search/i })
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /create another proof pack/i })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          href: expect.stringContaining('/onboarding?next=%2Fcandidate-invite%2Ftoken-value'),
        }),
      ])
    );
    expect(screen.getByLabelText(/owner-only proof pack/i)).toHaveValue(
      '11111111-1111-4111-8111-111111111111'
    );
    expect(screen.queryByLabelText(/owner-only proof pack id/i)).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/00000000-0000-0000-0000-000000000000/)
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open privacy settings/i })).toHaveAttribute(
      'href',
      '/app/i/settings/privacy'
    );

    fireEvent.click(screen.getByRole('button', { name: /review assignment proof/i }));
    fireEvent.click(screen.getByLabelText(/I reviewed the visibility summary/i));
    fireEvent.click(screen.getByRole('button', { name: /submit reviewed proof/i }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/candidate-invites/token-value/proof-card',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    const submitCall = apiFetchMock.mock.calls.find(
      ([url]) => url === '/api/candidate-invites/token-value/proof-card'
    );
    expect(JSON.parse(String(submitCall?.[1]?.body))).toEqual({
      proofPackId: '11111111-1111-4111-8111-111111111111',
      reviewConfirmed: true,
    });
    expect(screen.getByRole('status')).toHaveTextContent(
      /Assignment proof submitted for blind-first review\. No verification requests were sent\./i
    );
    expect(apiFetchMock.mock.calls.some(([url]) => url === '/api/profile/snippet')).toBe(false);
  });

  it('does not expose unsupported legacy trust gates to candidates', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url === '/api/candidate-invites/token-value') {
        return {
          ok: true,
          json: async () => ({
            invite: {
              id: 'invite-1',
              status: 'claimed',
              flowType: 'proof_card',
              assignmentId: 'assignment-1',
              maskedEmail: 'ca***@example.com',
              expiresAt: new Date(Date.now() + 3600_000).toISOString(),
              claimedAt: new Date().toISOString(),
              claimedByCurrentUser: true,
              acceptedAt: null,
              acceptedByCurrentUser: false,
              communicationsUrl: null,
              proofSubmittedAt: null,
            },
            organization: {
              id: 'org-1',
              slug: 'acme',
              displayName: 'Acme Org',
              logoUrl: null,
            },
            assignment: {
              ...structuredAssignment,
              verificationGates: ['work_email', 'linkedin'],
            },
          }),
        };
      }

      if (url === '/api/user/me') {
        return {
          ok: true,
          json: async () => ({
            id: 'user-1',
            email: 'candidate@example.com',
          }),
        };
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock as any);

    render(<CandidateInviteClient token="token-value" />);

    await waitFor(() => {
      expect(screen.getByText(/submit assignment-specific proof/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Work email check/i)).toBeInTheDocument();
    const visibleText = document.body.textContent ?? '';
    expect(visibleText).not.toMatch(/LinkedIn|unsupported trust/i);
  });

  it('shows the structured assignment before asking an unauthenticated guest to submit proof', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url === '/api/candidate-invites/token-value') {
        return {
          ok: true,
          json: async () => ({
            invite: {
              id: 'invite-1',
              status: 'pending',
              flowType: 'proof_card',
              assignmentId: 'assignment-1',
              maskedEmail: 'ca***@example.com',
              expiresAt: new Date(Date.now() + 3600_000).toISOString(),
              claimedAt: null,
              claimedByCurrentUser: false,
              acceptedAt: null,
              acceptedByCurrentUser: false,
              communicationsUrl: null,
              proofSubmittedAt: null,
            },
            organization: {
              id: 'org-1',
              slug: 'acme',
              displayName: 'Acme Org',
              logoUrl: null,
            },
            assignment: structuredAssignment,
          }),
        };
      }

      if (url === '/api/user/me') {
        return {
          ok: false,
          json: async () => ({ error: 'Unauthorized' }),
        };
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock as any);

    render(<CandidateInviteClient token="token-value" />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /designer/i })).toBeInTheDocument();
    });

    const pageText = document.body.textContent ?? '';
    expect(pageText.indexOf('Improve submission review quality')).toBeGreaterThanOrEqual(0);
    expect(pageText.indexOf('Continue to proof submission')).toBeGreaterThan(
      pageText.indexOf('Improve submission review quality')
    );
    expect(screen.getByRole('link', { name: /continue to proof submission/i })).toHaveAttribute(
      'href',
      '/signup/individual?next=%2Fcandidate-invite%2Ftoken-value'
    );
  });

  it('lets a signed-in candidate accept a pending proof-card invite before choosing proof', async () => {
    let claimed = false;
    const proofPack = {
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Service design proof pack',
      summary: 'One owner-only proof pack for this assignment.',
      evidenceSummary: null,
      outcomesSummary: null,
      verificationSummary: null,
      updatedAt: new Date().toISOString(),
    };
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url === '/api/candidate-invites/token-value') {
        return {
          ok: true,
          json: async () => ({
            invite: {
              id: 'invite-1',
              status: claimed ? 'claimed' : 'pending',
              flowType: 'proof_card',
              assignmentId: 'assignment-1',
              maskedEmail: 'ca***@example.com',
              expiresAt: new Date(Date.now() + 3600_000).toISOString(),
              claimedAt: claimed ? new Date().toISOString() : null,
              claimedByCurrentUser: claimed,
              acceptedAt: null,
              acceptedByCurrentUser: false,
              communicationsUrl: null,
              proofSubmittedAt: null,
            },
            organization: {
              id: 'org-1',
              slug: 'acme',
              displayName: 'Acme Org',
              logoUrl: null,
            },
            assignment: structuredAssignment,
            availableProofPacks: claimed ? [proofPack] : [],
          }),
        };
      }

      if (url === '/api/user/me') {
        return {
          ok: true,
          json: async () => ({
            id: 'user-1',
            email: 'candidate@example.com',
          }),
        };
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    apiFetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/candidate-invites/token-value/claim') {
        claimed = true;
        return {
          ok: true,
          json: async () => ({ success: true, status: 'claimed' }),
        } as Response;
      }

      throw new Error(`Unexpected apiFetch URL: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock as any);

    render(<CandidateInviteClient token="token-value" />);

    await screen.findByRole('heading', { name: /designer/i });

    expect(screen.getByRole('button', { name: /start proof submission/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/owner-only proof pack/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /start proof submission/i }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/candidate-invites/token-value/claim',
        expect.objectContaining({ method: 'POST' })
      );
    });
    await waitFor(() => {
      expect(screen.getByLabelText(/owner-only proof pack/i)).toHaveValue(proofPack.id);
    });
    expect(screen.getByRole('status')).toHaveTextContent(
      /Application started\. Review visibility before you submit proof\./i
    );
    expect(
      screen.queryByRole('button', { name: /start proof submission/i })
    ).not.toBeInTheDocument();
  });

  it('keeps pending invite acceptance retryable when claim fails', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url === '/api/candidate-invites/token-value') {
        return {
          ok: true,
          json: async () => ({
            invite: {
              id: 'invite-1',
              status: 'pending',
              flowType: 'proof_card',
              assignmentId: 'assignment-1',
              maskedEmail: 'ca***@example.com',
              expiresAt: new Date(Date.now() + 3600_000).toISOString(),
              claimedAt: null,
              claimedByCurrentUser: false,
              acceptedAt: null,
              acceptedByCurrentUser: false,
              communicationsUrl: null,
              proofSubmittedAt: null,
            },
            organization: {
              id: 'org-1',
              slug: 'acme',
              displayName: 'Acme Org',
              logoUrl: null,
            },
            assignment: structuredAssignment,
            availableProofPacks: [],
          }),
        };
      }

      if (url === '/api/user/me') {
        return {
          ok: true,
          json: async () => ({
            id: 'user-1',
            email: 'candidate@example.com',
          }),
        };
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    apiFetchMock.mockRejectedValueOnce(new Error('claim service unavailable'));

    vi.stubGlobal('fetch', fetchMock as any);

    render(<CandidateInviteClient token="token-value" />);

    await screen.findByRole('heading', { name: /designer/i });

    fireEvent.click(screen.getByRole('button', { name: /start proof submission/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invite could not be accepted. Your assignment context is still here; please try again.'
    );
    expect(screen.getByText(/No proof was submitted, no visibility changed/i)).toBeInTheDocument();
    expect(screen.getByText(/Improve submission review quality/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start proof submission/i })).toBeEnabled();
    expect(screen.queryByLabelText(/owner-only proof pack/i)).not.toBeInTheDocument();
  });

  it('keeps unexpected returned claim failures safe and diagnostic', async () => {
    const rawError = 'database update failed: org_candidate_invites policy detail';
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url === '/api/candidate-invites/token-value') {
        return {
          ok: true,
          json: async () => ({
            invite: {
              id: 'invite-1',
              status: 'pending',
              flowType: 'proof_card',
              assignmentId: 'assignment-1',
              maskedEmail: 'ca***@example.com',
              expiresAt: new Date(Date.now() + 3600_000).toISOString(),
              claimedAt: null,
              claimedByCurrentUser: false,
              acceptedAt: null,
              acceptedByCurrentUser: false,
              communicationsUrl: null,
              proofSubmittedAt: null,
            },
            organization: {
              id: 'org-1',
              slug: 'acme',
              displayName: 'Acme Org',
              logoUrl: null,
            },
            assignment: structuredAssignment,
            availableProofPacks: [],
          }),
        };
      }

      if (url === '/api/user/me') {
        return {
          ok: true,
          json: async () => ({
            id: 'user-1',
            email: 'candidate@example.com',
          }),
        };
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    apiFetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ error: rawError }),
    } as Response);

    vi.stubGlobal('fetch', fetchMock as any);

    render(<CandidateInviteClient token="token-value" />);

    await screen.findByRole('heading', { name: /designer/i });

    fireEvent.click(screen.getByRole('button', { name: /start proof submission/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Invite could not be accepted. Your assignment context is still here; please try again.'
    );
    expect(alert).not.toHaveTextContent(rawError);
    expect(screen.getByText(/No proof was submitted, no visibility changed/i)).toBeInTheDocument();
    expect(screen.getByText(/Improve submission review quality/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start proof submission/i })).toBeEnabled();
    expect(dispatchClientDiagnosticMock).toHaveBeenCalledWith(
      'candidate_invite.client.claim_returned_error',
      {
        status: 503,
        hasReturnedError: true,
      }
    );
    expect(JSON.stringify(dispatchClientDiagnosticMock.mock.calls)).not.toContain(rawError);
    expect(JSON.stringify(dispatchClientErrorDiagnosticMock.mock.calls)).not.toContain(rawError);
  });

  it('shows a neutral retry state when invitation verification is temporarily unavailable', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url === '/api/candidate-invites/not-a-real-token') {
        return {
          ok: false,
          status: 503,
          json: async () => ({ error: 'Service temporarily unavailable' }),
        };
      }

      if (url === '/api/user/me') {
        return {
          ok: false,
          json: async () => ({ error: 'Unauthorized' }),
        };
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock as any);

    render(<CandidateInviteClient token="not-a-real-token" />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /invitation unavailable/i })).toBeInTheDocument();
    });

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('We could not verify this invitation right now.');
    expect(alert).toHaveTextContent('No proof was submitted, no visibility changed');
    expect(alert).toHaveTextContent('Refresh this page');
    expect(screen.queryByText(/Service temporarily unavailable/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /return home/i })).toHaveAttribute('href', '/');
  });

  it('keeps invalid public tokens safe without implying a temporary outage', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url === '/api/candidate-invites/not-a-real-token') {
        return {
          ok: false,
          status: 404,
          json: async () => ({ error: 'Invite not found' }),
        };
      }

      if (url === '/api/user/me') {
        return {
          ok: false,
          json: async () => ({ error: 'Unauthorized' }),
        };
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock as any);

    render(<CandidateInviteClient token="not-a-real-token" />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'This invitation link is invalid, expired, or no longer available.'
    );
    expect(alert).toHaveTextContent('No proof was submitted, no visibility changed');
    expect(alert).toHaveTextContent('Ask the company to send a fresh assignment invite');
    expect(alert).not.toHaveTextContent('Invite not found');
  });

  it('keeps invite load status authoritative over returned server wording', async () => {
    const rawError = 'Service temporarily unavailable for invite lookup: candidate_invites missing';
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url === '/api/candidate-invites/not-a-real-token') {
        return {
          ok: false,
          status: 400,
          json: async () => ({ error: rawError }),
        };
      }

      if (url === '/api/user/me') {
        return {
          ok: false,
          json: async () => ({ error: 'Unauthorized' }),
        };
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock as any);

    render(<CandidateInviteClient token="not-a-real-token" />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'This invitation link is invalid, expired, or no longer available.'
    );
    expect(alert).toHaveTextContent('No proof was submitted, no visibility changed');
    expect(alert).not.toHaveTextContent(rawError);
    expect(alert).not.toHaveTextContent('We could not verify this invitation right now.');
    expect(dispatchClientDiagnosticMock).toHaveBeenCalledWith(
      'candidate_invite.client.load_returned_error',
      {
        status: 400,
        hasReturnedError: true,
      }
    );
    expect(JSON.stringify(dispatchClientDiagnosticMock.mock.calls)).not.toContain(rawError);
    expect(JSON.stringify(dispatchClientErrorDiagnosticMock.mock.calls)).not.toContain(rawError);
  });

  it('pauses proof submission when an invite is missing structured assignment context', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url === '/api/candidate-invites/token-value') {
        return {
          ok: true,
          json: async () => ({
            invite: {
              id: 'invite-1',
              status: 'claimed',
              flowType: 'proof_card',
              assignmentId: null,
              maskedEmail: 'ca***@example.com',
              expiresAt: new Date(Date.now() + 3600_000).toISOString(),
              claimedAt: new Date().toISOString(),
              claimedByCurrentUser: true,
              acceptedAt: null,
              acceptedByCurrentUser: false,
              communicationsUrl: null,
              proofSubmittedAt: null,
            },
            organization: {
              id: 'org-1',
              slug: 'acme',
              displayName: 'Acme Org',
              logoUrl: null,
            },
            assignment: null,
            availableProofPacks: [
              {
                id: '11111111-1111-4111-8111-111111111111',
                title: 'Service design proof pack',
                summary: 'One owner-only proof pack for this assignment.',
                evidenceSummary: null,
                outcomesSummary: null,
                verificationSummary: null,
                updatedAt: new Date().toISOString(),
              },
            ],
          }),
        };
      }

      if (url === '/api/user/me') {
        return {
          ok: true,
          json: async () => ({
            id: 'user-1',
            email: 'candidate@example.com',
          }),
        };
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock as any);

    render(<CandidateInviteClient token="token-value" />);

    await waitFor(() => {
      expect(screen.getByText(/Proof submission paused/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/missing the structured assignment context required/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /continue to proof submission/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /review assignment proof/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/owner-only proof pack/i)).not.toBeInTheDocument();
  });

  it('keeps assignment proof submissions proof-first and submits owner-only Proof Packs', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url === '/api/candidate-invites/token-value') {
        return {
          ok: true,
          json: async () => ({
            invite: {
              id: 'invite-1',
              status: 'claimed',
              flowType: 'proof_card',
              assignmentId: 'assignment-1',
              maskedEmail: 'ca***@example.com',
              expiresAt: new Date(Date.now() + 3600_000).toISOString(),
              claimedAt: new Date().toISOString(),
              claimedByCurrentUser: true,
              acceptedAt: null,
              acceptedByCurrentUser: false,
              communicationsUrl: null,
              proofSubmittedAt: null,
            },
            organization: {
              id: 'org-1',
              slug: 'acme',
              displayName: 'Acme Org',
              logoUrl: null,
            },
            assignment: {
              id: 'assignment-1',
              role: 'Evidence Operations Lead',
              description: 'Run proof-backed launch evidence.',
              status: 'active',
              engagementType: 'project_based',
              businessValue: 'Reduce review noise with scoped evidence.',
              expectedImpact: 'Show one artifact with ownership and outcome context.',
              mustHaveSkills: [{ label: 'Evidence review' }],
              verificationGates: ['work_email'],
              createdAt: new Date().toISOString(),
            },
            availableProofPacks: [
              {
                id: '11111111-1111-4111-8111-111111111111',
                title: 'Evidence operations proof pack',
                summary: 'One owner-only proof pack for this assignment.',
                evidenceSummary: null,
                outcomesSummary: null,
                verificationSummary: null,
                updatedAt: new Date().toISOString(),
              },
            ],
          }),
        };
      }

      if (url === '/api/user/me') {
        return {
          ok: true,
          json: async () => ({
            id: 'user-1',
            email: 'candidate@example.com',
          }),
        };
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    apiFetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url === '/api/candidate-invites/token-value/proof-card') {
        expect(init?.method).toBe('POST');
        expect(JSON.parse(String(init?.body))).toEqual({
          proofPackId: '11111111-1111-4111-8111-111111111111',
          reviewConfirmed: true,
        });
        return {
          ok: true,
          json: async () => ({
            success: true,
            status: 'proof_submitted',
            canonicalPackId: '11111111-1111-4111-8111-111111111111',
            canonicalSubmissionId: 'submission-1',
          }),
        } as Response;
      }

      throw new Error(`Unexpected apiFetch URL: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock as any);

    render(<CandidateInviteClient token="token-value" />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Evidence Operations Lead' })).toBeInTheDocument();
    });

    expect(screen.getByText(/Create or choose one owner-only Proof Pack/i)).toBeInTheDocument();
    expect(screen.getByTestId('candidate-proof-submission-path')).toBeInTheDocument();
    expect(screen.getAllByText(/one claim or outcome/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /create another proof pack/i })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          href: expect.stringContaining('/onboarding?next=%2Fcandidate-invite%2Ftoken-value'),
        }),
      ])
    );
    expect(screen.queryByText(/generate and submit proof card/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/existing proof card token/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/owner-only proof pack/i)).toHaveValue(
      '11111111-1111-4111-8111-111111111111'
    );
    expect(screen.queryByLabelText(/owner-only proof pack id/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /review assignment proof/i }));
    fireEvent.click(screen.getByLabelText(/I reviewed the visibility summary/i));
    fireEvent.click(screen.getByRole('button', { name: /submit reviewed proof/i }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/candidate-invites/token-value/proof-card',
        expect.objectContaining({
          body: JSON.stringify({
            proofPackId: '11111111-1111-4111-8111-111111111111',
            reviewConfirmed: true,
          }),
        })
      );
    });

    expect(screen.getByRole('status')).toHaveTextContent(
      /Assignment proof submitted for blind-first review\. No verification requests were sent\./i
    );
    expect(apiFetchMock).not.toHaveBeenCalledWith('/api/profile/snippet', expect.anything());
  });

  it('keeps reviewed assignment proof recoverable when submission fails', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url === '/api/candidate-invites/token-value') {
        return {
          ok: true,
          json: async () => ({
            invite: {
              id: 'invite-1',
              status: 'claimed',
              flowType: 'proof_card',
              assignmentId: 'assignment-1',
              maskedEmail: 'ca***@example.com',
              expiresAt: new Date(Date.now() + 3600_000).toISOString(),
              claimedAt: new Date().toISOString(),
              claimedByCurrentUser: true,
              acceptedAt: null,
              acceptedByCurrentUser: false,
              communicationsUrl: null,
              proofSubmittedAt: null,
            },
            organization: {
              id: 'org-1',
              slug: 'acme',
              displayName: 'Acme Org',
              logoUrl: null,
            },
            assignment: structuredAssignment,
            availableProofPacks: [
              {
                id: '11111111-1111-4111-8111-111111111111',
                title: 'Service design proof pack',
                summary: 'One owner-only proof pack for this assignment.',
                evidenceSummary: 'Private evidence stays in the assignment packet.',
                outcomesSummary: null,
                verificationSummary: null,
                updatedAt: new Date().toISOString(),
              },
            ],
          }),
        };
      }

      if (url === '/api/user/me') {
        return {
          ok: true,
          json: async () => ({
            id: 'user-1',
            email: 'candidate@example.com',
          }),
        };
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    apiFetchMock.mockRejectedValueOnce(new Error('submission service unavailable'));

    vi.stubGlobal('fetch', fetchMock as any);

    render(<CandidateInviteClient token="token-value" />);

    await screen.findByRole('heading', { name: /designer/i });

    fireEvent.click(screen.getByRole('button', { name: /review assignment proof/i }));
    fireEvent.click(screen.getByLabelText(/I reviewed the visibility summary/i));
    fireEvent.click(screen.getByRole('button', { name: /submit reviewed proof/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Assignment proof could not be submitted.'
    );
    expect(
      screen.getByText(
        'Your selected Proof Pack and visibility review are still here. Check the summary, then try submitting again.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/Final review before submission/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Service design proof pack/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/I reviewed the visibility summary/i)).toBeChecked();
    expect(screen.getByRole('button', { name: /submit reviewed proof/i })).toBeEnabled();
  });

  it('maps returned proof-card validation failures to safe candidate copy', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid proof card payload' }),
    } as Response);

    renderClaimedProofCardInvite();

    fireEvent.click(screen.getByRole('button', { name: /review assignment proof/i }));
    fireEvent.click(screen.getByLabelText(/I reviewed the visibility summary/i));
    fireEvent.click(screen.getByRole('button', { name: /submit reviewed proof/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Review the selected Proof Pack and visibility confirmation before submitting.'
    );
    expect(
      screen.getByText(
        'Your selected Proof Pack and visibility review are still here. Check the summary, then try submitting again.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/Final review before submission/i)).toBeInTheDocument();
    expect(dispatchClientErrorDiagnosticMock).not.toHaveBeenCalledWith(
      'candidate_invite.client.proof_submit_returned_error',
      expect.any(Error)
    );
  });

  it('keeps unexpected returned proof-card failures safe and diagnostic', async () => {
    const rawError = 'database insert failed: policy stack detail';
    apiFetchMock.mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => ({ error: rawError }),
    } as Response);

    renderClaimedProofCardInvite();

    fireEvent.click(screen.getByRole('button', { name: /review assignment proof/i }));
    fireEvent.click(screen.getByLabelText(/I reviewed the visibility summary/i));
    fireEvent.click(screen.getByRole('button', { name: /submit reviewed proof/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Assignment proof could not be submitted.');
    expect(alert).not.toHaveTextContent(rawError);
    expect(
      screen.getByText(
        'Your selected Proof Pack and visibility review are still here. Check the summary, then try submitting again.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/Final review before submission/i)).toBeInTheDocument();
    expect(dispatchClientDiagnosticMock).toHaveBeenCalledWith(
      'candidate_invite.client.proof_submit_returned_error',
      {
        status: 502,
        hasReturnedError: true,
      }
    );
    expect(JSON.stringify(dispatchClientDiagnosticMock.mock.calls)).not.toContain(rawError);
    expect(JSON.stringify(dispatchClientErrorDiagnosticMock.mock.calls)).not.toContain(rawError);
  });

  it('supports local visual initial state without calling the public token API', async () => {
    vi.stubGlobal('fetch', vi.fn());

    render(
      <CandidateInviteClient
        token="visual-proof-card-claimed"
        visualMode
        initialState={{
          invite: {
            id: 'visual-candidate-invite-1',
            status: 'claimed',
            flowType: 'proof_card',
            assignmentId: 'assignment-1',
            maskedEmail: 'ca***@example.com',
            expiresAt: new Date(Date.now() + 3600_000).toISOString(),
            claimedAt: new Date().toISOString(),
            claimedByCurrentUser: true,
            acceptedAt: null,
            acceptedByCurrentUser: false,
            communicationsUrl: null,
            proofSubmittedAt: null,
          },
          organization: {
            id: 'org-1',
            slug: 'acme',
            displayName: 'Acme Org',
            logoUrl: null,
          },
          assignment: structuredAssignment,
          currentUser: {
            id: 'user-1',
            email: 'candidate@example.com',
          },
          availableProofPacks: [
            {
              id: '11111111-1111-4111-8111-111111111111',
              title: 'Owner-only pilot proof pack',
              summary: 'A private proof pack for this assignment.',
              evidenceSummary: 'Evidence summary.',
              outcomesSummary: 'Outcome summary.',
              verificationSummary: 'No new verification request is sent.',
              updatedAt: new Date().toISOString(),
            },
          ],
        }}
      />
    );

    await screen.findByRole('heading', { name: /designer/i });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(apiFetchMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /review assignment proof/i }));
    expect(screen.getByText(/participant-controlled reveal step/i)).toBeInTheDocument();
    expect(screen.queryByText(/candidate-controlled corridor step/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit reviewed proof/i })).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/I reviewed the visibility summary/i));
    fireEvent.click(screen.getByRole('button', { name: /submit reviewed proof/i }));

    await waitFor(() => {
      expect(screen.getByText(/saved privately to your submission workspace/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /open proof packs/i })).toHaveAttribute(
      'href',
      '/app/i/profile?profileView=full&tab=proof_packs'
    );
    expect(screen.getByRole('link', { name: /open visibility settings/i })).toHaveAttribute(
      'href',
      '/app/i/profile?profileView=full&tab=visibility'
    );
    expect(screen.getByRole('link', { name: /export or delete data/i })).toHaveAttribute(
      'href',
      '/app/i/settings/privacy'
    );
    expect(screen.getByRole('link', { name: /open assignment review/i })).toHaveAttribute(
      'href',
      '/app/i/matching'
    );
    expect(
      screen.queryByText(/saved privately to your candidate workspace/i)
    ).not.toBeInTheDocument();
    expect(apiFetchMock).not.toHaveBeenCalled();
  });
});
