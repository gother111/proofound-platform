import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CandidateInviteClient } from '@/app/candidate-invite/[token]/CandidateInviteClient';
import { apiFetch } from '@/lib/api/fetch';

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: vi.fn(),
}));

const apiFetchMock = vi.mocked(apiFetch);

const structuredAssignment = {
  id: 'assignment-1',
  role: 'Designer',
  description: 'Shape a proof-led onboarding corridor for external candidates.',
  status: 'active',
  createdAt: new Date().toISOString(),
  engagementType: 'contract_consulting',
  businessValue: 'Improve candidate review quality before the first conversation.',
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
      expect(screen.getByText(/trial match accepted/i)).toBeInTheDocument();
    });

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
    expect(screen.getByText(/Improve candidate review quality/i)).toBeInTheDocument();
    expect(screen.getByText(/Submit one work artifact/i)).toBeInTheDocument();
    expect(screen.getByText(/Remote \/ Stockholm, Sweden/i)).toBeInTheDocument();
    expect(screen.getByText(/Identity check/i)).toBeInTheDocument();
    expect(screen.getByText(/Work email check/i)).toBeInTheDocument();
    expect(screen.getByText(/Private review first/i)).toBeInTheDocument();
    expect(
      screen.getByText(/does not publish a public page or broaden the application/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Public profile snippets and share URLs are not accepted/i)
    ).toBeInTheDocument();
    const visibleText = document.body.textContent ?? '';
    expect(visibleText).not.toMatch(/cv import|resume|public directory|people search/i);
    expect(visibleText).not.toMatch(/values|causes|mission-first|purpose-fit/i);
    expect(screen.queryByRole('button', { name: /score|rank|shortlist/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /cv import|resume|people search/i })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create first proof pack/i })).toHaveAttribute(
      'href',
      '/onboarding?next=%2Fcandidate-invite%2Ftoken-value'
    );

    fireEvent.change(screen.getByLabelText(/owner-only proof pack id/i), {
      target: { value: '11111111-1111-4111-8111-111111111111' },
    });
    fireEvent.click(screen.getByRole('button', { name: /review assignment proof/i }));
    fireEvent.click(screen.getByLabelText(/I reviewed the visibility summary/i));
    fireEvent.click(screen.getByRole('button', { name: /submit reviewed application/i }));

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
    expect(apiFetchMock.mock.calls.some(([url]) => url === '/api/profile/snippet')).toBe(false);
  });

  it('shows the structured assignment before asking an unauthenticated guest to apply', async () => {
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
    expect(pageText.indexOf('Improve candidate review quality')).toBeGreaterThanOrEqual(0);
    expect(pageText.indexOf('Apply to this assignment')).toBeGreaterThan(
      pageText.indexOf('Improve candidate review quality')
    );
    expect(screen.getByRole('link', { name: /apply to this assignment/i })).toHaveAttribute(
      'href',
      '/signup/individual?next=%2Fcandidate-invite%2Ftoken-value'
    );
  });

  it('keeps assignment proof applications proof-first and submits owner-only Proof Packs', async () => {
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
    expect(screen.getByRole('link', { name: /create first proof pack/i })).toHaveAttribute(
      'href',
      '/onboarding?next=%2Fcandidate-invite%2Ftoken-value'
    );
    expect(screen.queryByText(/generate and submit proof card/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/existing proof card token/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/owner-only proof pack id/i), {
      target: { value: '11111111-1111-4111-8111-111111111111' },
    });
    fireEvent.click(screen.getByRole('button', { name: /review assignment proof/i }));
    fireEvent.click(screen.getByLabelText(/I reviewed the visibility summary/i));
    fireEvent.click(screen.getByRole('button', { name: /submit reviewed application/i }));

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

    expect(apiFetchMock).not.toHaveBeenCalledWith('/api/profile/snippet', expect.anything());
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
              verificationSummary: 'No new verification email is sent.',
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
    expect(screen.getByRole('button', { name: /submit reviewed application/i })).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/I reviewed the visibility summary/i));
    fireEvent.click(screen.getByRole('button', { name: /submit reviewed application/i }));

    await waitFor(() => {
      expect(screen.getByText(/saved privately to your candidate workspace/i)).toBeInTheDocument();
    });
    expect(apiFetchMock).not.toHaveBeenCalled();
  });
});
