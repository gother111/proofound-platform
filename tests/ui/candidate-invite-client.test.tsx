import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CandidateInviteClient } from '@/app/candidate-invite/[token]/CandidateInviteClient';

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: vi.fn(),
}));

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
              claimedByProfileId: 'user-1',
              acceptedAt: new Date().toISOString(),
              acceptedByProfileId: 'user-1',
              matchId: 'match-1',
              conversationId: 'conversation-1',
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

    expect(screen.getByRole('link', { name: /open messages/i })).toHaveAttribute(
      'href',
      '/app/i/messages?conversation=conversation-1'
    );
  });
});
