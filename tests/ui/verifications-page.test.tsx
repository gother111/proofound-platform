import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireAuthMock, createClientMock, createAdminClientMock, verificationsClientSpy } =
  vi.hoisted(() => ({
    requireAuthMock: vi.fn(),
    createClientMock: vi.fn(),
    createAdminClientMock: vi.fn(),
    verificationsClientSpy: vi.fn(),
  }));

vi.mock('@/lib/auth', () => ({
  requireAuth: requireAuthMock,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock('@/app/app/i/verifications/VerificationsClient', () => ({
  VerificationsClient: (props: unknown) => {
    verificationsClientSpy(props);
    return <div data-testid="verifications-client-proxy" />;
  },
}));

import VerificationsPage from '@/app/app/i/verifications/page';

type QueryResult = { data: unknown[]; error: null };

function createSupabaseClientMock(options: {
  userEmail: string;
  incomingSkill: unknown[];
  sentSkill: unknown[];
  sentImpact: unknown[];
}) {
  const resolveQuery = (table: string, column: string): QueryResult => {
    if (table === 'skill_verification_requests' && column === 'verifier_email') {
      return { data: options.incomingSkill, error: null };
    }
    if (table === 'skill_verification_requests' && column === 'requester_profile_id') {
      return { data: options.sentSkill, error: null };
    }
    if (table === 'impact_story_verification_requests' && column === 'requester_profile_id') {
      return { data: options.sentImpact, error: null };
    }
    return { data: [], error: null };
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { email: options.userEmail } },
      }),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn((column: string) => ({
          order: vi.fn().mockResolvedValue(resolveQuery(table, column)),
        })),
      })),
    })),
  };
}

function createAdminClientMockResult(incomingImpact: unknown[]) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({ data: incomingImpact, error: null }),
        })),
      })),
    })),
  };
}

describe('VerificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthMock.mockResolvedValue({ id: 'user-1' });
  });

  it('merges skill and impact requests for incoming and sent views', async () => {
    createClientMock.mockResolvedValue(
      createSupabaseClientMock({
        userEmail: 'user@example.com',
        incomingSkill: [
          {
            id: 'skill-incoming-1',
            skill_id: 'skill-1',
            requester_profile_id: 'requester-1',
            verifier_email: 'user@example.com',
            verifier_source: 'peer',
            status: 'pending',
            created_at: '2026-02-25T10:00:00.000Z',
          },
        ],
        sentSkill: [
          {
            id: 'skill-sent-1',
            skill_id: 'skill-2',
            requester_profile_id: 'user-1',
            verifier_email: 'reviewer@example.com',
            verifier_source: 'manager',
            status: 'accepted',
            created_at: '2026-02-22T10:00:00.000Z',
          },
        ],
        sentImpact: [
          {
            id: 'impact-sent-1',
            impact_story_id: 'story-2',
            requester_profile_id: 'user-1',
            verifier_email: 'impact-reviewer@example.com',
            verifier_name: 'Alex Reviewer',
            verifier_relationship: 'Client',
            status: 'accepted',
            created_at: '2026-02-24T10:00:00.000Z',
            impact_stories: { id: 'story-2', title: 'Public Health Program' },
          },
        ],
      })
    );

    createAdminClientMock.mockReturnValue(
      createAdminClientMockResult([
        {
          id: 'impact-incoming-1',
          impact_story_id: 'story-1',
          requester_profile_id: 'requester-2',
          verifier_email: 'user@example.com',
          verifier_name: 'Taylor',
          verifier_relationship: 'Partner',
          status: 'pending',
          created_at: '2026-02-26T10:00:00.000Z',
          impact_stories: { id: 'story-1', title: 'Climate Adaptation' },
          profiles: { id: 'requester-2', display_name: 'Jordan Sender' },
        },
      ])
    );

    const element = await VerificationsPage();
    render(element);

    expect(screen.getByTestId('verifications-client-proxy')).toBeInTheDocument();
    expect(verificationsClientSpy).toHaveBeenCalledTimes(1);

    const props = verificationsClientSpy.mock.calls[0]?.[0] as {
      incomingRequests: Array<{ id: string; request_type: string; created_at: string }>;
      sentRequests: Array<{ id: string; request_type: string; impact_story_title?: string | null }>;
    };

    expect(props.incomingRequests.map((request) => request.id)).toEqual([
      'impact-incoming-1',
      'skill-incoming-1',
    ]);
    expect(props.incomingRequests.map((request) => request.request_type)).toEqual([
      'impact_story',
      'skill',
    ]);

    expect(props.sentRequests.map((request) => request.id)).toEqual([
      'impact-sent-1',
      'skill-sent-1',
    ]);
    expect(props.sentRequests.map((request) => request.request_type)).toEqual([
      'impact_story',
      'skill',
    ]);
    expect(props.sentRequests[0]?.impact_story_title).toBe('Public Health Program');
  });

  it('falls back gracefully when admin client for incoming impact requests is unavailable', async () => {
    createClientMock.mockResolvedValue(
      createSupabaseClientMock({
        userEmail: 'user@example.com',
        incomingSkill: [
          {
            id: 'skill-incoming-only',
            skill_id: 'skill-1',
            requester_profile_id: 'requester-1',
            verifier_email: 'user@example.com',
            verifier_source: 'peer',
            status: 'pending',
            created_at: '2026-02-25T10:00:00.000Z',
          },
        ],
        sentSkill: [],
        sentImpact: [],
      })
    );

    createAdminClientMock.mockImplementation(() => {
      throw new Error('Missing SUPABASE env for admin client');
    });

    const element = await VerificationsPage();
    render(element);

    expect(screen.getByTestId('verifications-client-proxy')).toBeInTheDocument();

    const props = verificationsClientSpy.mock.calls[0]?.[0] as {
      incomingRequests: Array<{ id: string; request_type: string }>;
      sentRequests: unknown[];
    };

    expect(props.incomingRequests).toHaveLength(1);
    expect(props.incomingRequests[0]).toMatchObject({
      id: 'skill-incoming-only',
      request_type: 'skill',
    });
    expect(props.sentRequests).toHaveLength(0);
  });
});
