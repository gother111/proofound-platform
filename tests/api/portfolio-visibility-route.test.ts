// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      portfolioPublicationStates: {
        findFirst: vi.fn(),
      },
    },
  },
}));

vi.mock('@/lib/analytics/lifecycle-events', () => ({
  emitLifecycleEvent: vi.fn(),
}));

vi.mock('@/lib/proof-trust/snapshots', () => ({
  computePortfolioPublicationState: vi.fn(),
}));

vi.mock('@/lib/portfolio/public-invalidation', () => ({
  revalidatePublicPortfolioByProfileId: vi.fn(),
}));

import { POST } from '@/app/api/portfolio/visibility/route';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { computePortfolioPublicationState } from '@/lib/proof-trust/snapshots';

function request(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/portfolio/visibility', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function rawRequest(body: string) {
  return new NextRequest('http://localhost/api/portfolio/visibility', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}

function buildSupabase({
  individual = {
    field_visibility: {
      header: true,
      bio: true,
      contact: false,
      workEmail: false,
      identity: false,
      proofBar: true,
      linkedin: false,
      skills: false,
    },
    headline: 'Proof-first launch work',
    bio: 'Built a launch checklist.',
    tagline: null,
    work_email: 'jane@example.com',
  },
  profile = {
    display_name: 'Jane Doe',
    handle: 'jane',
  },
}: {
  individual?: Record<string, unknown>;
  profile?: Record<string, unknown>;
} = {}) {
  const individualUpdate = vi.fn(() => ({
    eq: vi.fn().mockResolvedValue({ error: null }),
  }));
  const profileUpdate = vi.fn(() => ({
    eq: vi.fn().mockResolvedValue({ error: null }),
  }));

  const from = vi.fn((table: string) => {
    if (table === 'individual_profiles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: individual, error: null }),
          })),
        })),
        update: individualUpdate,
      };
    }

    if (table === 'profiles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
          })),
        })),
        update: profileUpdate,
      };
    }

    throw new Error(`Unexpected table ${table}`);
  });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
      }),
    },
    from,
    __mocks: {
      individualUpdate,
      profileUpdate,
    },
  };
}

describe('POST /api/portfolio/visibility privacy preflight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.query.portfolioPublicationStates.findFirst as any).mockResolvedValue(null);
    vi.mocked(computePortfolioPublicationState as any).mockResolvedValue({
      publicationState: 'public_link_only',
      indexingState: 'noindex',
      robotsState: 'noindex_nofollow',
      sitemapState: 'excluded',
      reasonCodes: ['portfolio_visibility_saved'],
    });
  });

  it('requires review before publishing high-risk deterministic privacy flags', async () => {
    const supabase = buildSupabase({
      individual: {
        field_visibility: {
          header: true,
          bio: true,
          contact: false,
          workEmail: false,
          identity: false,
          proofBar: true,
          linkedin: false,
          skills: false,
        },
        headline: 'Launch proof for Jane Doe',
        bio: 'Email jane@example.com and see 221B Baker Street for the client note.',
        tagline: null,
        work_email: 'jane@example.com',
      },
      profile: {
        display_name: 'Jane Doe',
        handle: 'jane',
      },
    });
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    const response = await POST(
      request({
        publicPageEnabled: true,
        searchIndexingEnabled: false,
        header: true,
        bio: true,
        identity: false,
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error).toBe('Privacy review required');
    expect(payload.privacyPreflight.riskLevel).toBe('high');
    expect(payload.privacyPreflight.flags.map((flag: { code: string }) => flag.code)).toEqual(
      expect.arrayContaining(['email', 'exact_address', 'hidden_visibility_term'])
    );
    expect(supabase.__mocks.individualUpdate).not.toHaveBeenCalled();
    expect(supabase.__mocks.profileUpdate).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed JSON before auth or preflight work', async () => {
    const response = await POST(rawRequest('{'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON body' });
    expect(createClient).not.toHaveBeenCalled();
    expect(computePortfolioPublicationState).not.toHaveBeenCalled();
  });

  it('does not block low-risk publication automatically', async () => {
    const supabase = buildSupabase();
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    const response = await POST(
      request({
        publicPageEnabled: true,
        searchIndexingEnabled: false,
        header: true,
        bio: true,
      })
    );

    expect(response.status).toBe(200);
    expect(supabase.__mocks.individualUpdate).toHaveBeenCalled();
    expect(supabase.__mocks.profileUpdate).toHaveBeenCalled();
  });

  it('forces legacy LinkedIn visibility off even when clients request it', async () => {
    const supabase = buildSupabase({
      individual: {
        field_visibility: {
          header: true,
          bio: false,
          contact: false,
          workEmail: false,
          identity: true,
          proofBar: true,
          linkedin: true,
          skills: false,
        },
        headline: 'Proof-first launch work',
        bio: '',
        tagline: null,
        work_email: 'jane@example.com',
      },
    });
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    const response = await POST(
      request({
        publicPageEnabled: true,
        searchIndexingEnabled: false,
        linkedin: true,
      })
    );

    expect(response.status).toBe(200);
    expect(supabase.__mocks.individualUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        field_visibility: expect.objectContaining({
          linkedin: false,
        }),
      })
    );
  });

  it('hard-disables individual search indexing even when requested', async () => {
    const supabase = buildSupabase();
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    const response = await POST(
      request({
        publicPageEnabled: true,
        searchIndexingEnabled: true,
        header: true,
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.searchIndexingEnabled).toBe(false);
    expect(supabase.__mocks.profileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        public_portfolio_state: 'public_link_only',
        search_indexing_enabled_at: null,
      })
    );
  });
});
