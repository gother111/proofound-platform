import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/verify/[token]/route';

const createClientMock = vi.fn();
const createAdminClientMock = vi.fn();
const sendEmailMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => createClientMock(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => createAdminClientMock(),
}));

vi.mock('@/lib/email/sender', () => ({
  sendEmail: (...args: any[]) => sendEmailMock(...args),
}));

const TOKEN = 'a'.repeat(64);

function buildImpactAdminClient(overrides?: {
  impactRequest?: any;
  impactStory?: any;
  requesterProfile?: any;
  onImpactStoryUpdate?: (payload: any) => void;
}) {
  const impactRequest = overrides?.impactRequest || {
    id: 'req-1',
    impact_story_id: 'story-1',
    requester_profile_id: 'user-1',
    verifier_email: 'verifier@example.com',
    verifier_name: 'Verifier',
    verifier_relationship: 'Program Director',
    message: 'Please verify claims',
    status: 'pending',
    claim_snapshot: {
      roleClaim: { id: 'role', label: 'Role participation' },
      outcomeClaims: [{ id: 'outcome:o1', outcomeId: 'o1', label: 'Outcome one' }],
      artifactsClaim: { id: 'artifacts', label: 'Artifacts', enabled: true },
    },
    created_at: '2026-02-20T00:00:00.000Z',
    expires_at: '2099-02-20T00:00:00.000Z',
  };

  const impactStory = overrides?.impactStory || {
    id: 'story-1',
    title: 'Impact Story',
    user_id: 'user-1',
  };
  const requesterProfile = overrides?.requesterProfile || {
    email: 'requester@example.com',
    display_name: 'Requester',
    avatar_url: null,
  };

  const impactRequestSelect = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: impactRequest, error: null }),
    }),
  });

  const impactRequestUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });

  const impactStoryUpdateEq = vi.fn().mockResolvedValue({ error: null });
  const impactStoryUpdate = vi.fn((payload: any) => {
    overrides?.onImpactStoryUpdate?.(payload);
    return { eq: impactStoryUpdateEq };
  });

  return {
    from: vi.fn((table: string) => {
      if (table === 'impact_story_verification_requests') {
        return {
          select: impactRequestSelect,
          update: impactRequestUpdate,
        };
      }

      if (table === 'impact_stories') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: impactStory, error: null }),
            }),
          }),
          update: impactStoryUpdate,
        };
      }

      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: requesterProfile, error: null }),
            }),
          }),
        };
      }

      if (table === 'impact_story_verification_responses') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

describe('verify impact token route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createClientMock.mockReturnValue({ from: vi.fn() });
    sendEmailMock.mockResolvedValue({ success: true });
  });

  it('GET returns impact-story verification payload when token matches impact request', async () => {
    createAdminClientMock.mockReturnValue(buildImpactAdminClient());

    const response = await GET(new NextRequest(`http://localhost/api/verify/${TOKEN}`), {
      params: Promise.resolve({ token: TOKEN }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.verification.verification_type).toBe('impact_story');
    expect(body.verification.story_title).toBe('Impact Story');
    expect(body.verification.claims.roleClaim.id).toBe('role');
  });

  it('POST accepts impact claim confirmations and marks story verified', async () => {
    let impactUpdatePayload: any = null;
    createAdminClientMock.mockReturnValue(
      buildImpactAdminClient({
        onImpactStoryUpdate: (payload) => {
          impactUpdatePayload = payload;
        },
      })
    );

    const response = await POST(
      new NextRequest(`http://localhost/api/verify/${TOKEN}`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'accept',
          confirmedClaimIds: ['role', 'outcome:o1'],
          message: 'Confirmed from records',
        }),
      }),
      { params: Promise.resolve({ token: TOKEN }) }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.verification_type).toBe('impact_story');
    expect(body.status).toBe('accepted');
    expect(body.confirmed_claims.role).toBe(true);
    expect(body.confirmed_claims.outcomes).toEqual(['o1']);
    expect(impactUpdatePayload).toMatchObject({ verified: true });
  });
});
