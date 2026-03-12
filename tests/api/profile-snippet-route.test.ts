import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

vi.mock('@/lib/canonical/repository', () => ({
  CANONICAL_PROOFS_WRITE_ENABLED: false,
  deleteCanonicalProofPackForSnippet: vi.fn(),
  upsertCanonicalProofPackForSnippet: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { POST } from '@/app/api/profile/snippet/route';

function buildRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/profile/snippet', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function mockAuthenticatedUser(userId = '8c758e8d-ef1f-4fa8-abf2-9c00fa26f7c1') {
  (createClient as any).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: userId,
          },
        },
      }),
    },
  });
}

describe('POST /api/profile/snippet', () => {
  const orgId = '5d4d4397-2146-423f-a9b1-4e7f81657bd9';

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticatedUser();
  });

  it('creates an individual snippet by default', async () => {
    (db.execute as any)
      .mockResolvedValueOnce([
        {
          id: 'cap-token-1',
          token_class: 'profile_snippet_share',
          token_hash: 'hash-1',
          source_table: 'profile_snippets',
          source_id: 'snippet-1',
          action_scope: 'profile_snippet.read',
          subject_type: 'profile_snippet',
          subject_id: 'snippet-1',
          actor_binding: 'none',
          actor_email_hash: null,
          actor_profile_id: null,
          actor_org_id: null,
          principal_type: null,
          single_use: false,
          max_uses: 2147483647,
          redeemed_count: 0,
          issued_at: '2026-02-12T10:00:00.000Z',
          expires_at: '2026-03-14T10:00:00.000Z',
          first_redeemed_at: null,
          last_redeemed_at: null,
          revoked_at: null,
          revoked_reason: null,
          last_seen_at: null,
          last_seen_ip_hash: null,
          last_seen_user_agent_hash: null,
          metadata: {},
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'snippet-1',
          capability_token_id: 'cap-token-1',
          fields: { name: true },
          theme: 'auto',
          format: 'card',
          profile_type: 'individual',
          org_id: null,
          expires_at: null,
          created_at: '2026-02-12T10:00:00.000Z',
        },
      ]);

    const response = await POST(
      buildRequest({
        fields: { name: true },
        theme: 'auto',
        format: 'card',
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.snippet.profileType).toBe('individual');
    expect(body.snippet.orgId).toBeNull();
    expect(body.snippet.canonicalPackId).toBeNull();
    expect(body.snippet.shareToken).toEqual(expect.any(String));
    expect(body.snippet.url).toContain(body.snippet.shareToken);
    expect(db.execute).toHaveBeenCalledTimes(3);
  });

  it('creates an organization snippet for active members', async () => {
    (db.execute as any)
      .mockResolvedValueOnce([{ ok: true }])
      .mockResolvedValueOnce([
        {
          id: 'cap-token-2',
          token_class: 'profile_snippet_share',
          token_hash: 'hash-2',
          source_table: 'profile_snippets',
          source_id: 'snippet-2',
          action_scope: 'profile_snippet.read',
          subject_type: 'profile_snippet',
          subject_id: 'snippet-2',
          actor_binding: 'none',
          actor_email_hash: null,
          actor_profile_id: null,
          actor_org_id: null,
          principal_type: null,
          single_use: false,
          max_uses: 2147483647,
          redeemed_count: 0,
          issued_at: '2026-02-12T10:00:00.000Z',
          expires_at: '2026-03-14T10:00:00.000Z',
          first_redeemed_at: null,
          last_redeemed_at: null,
          revoked_at: null,
          revoked_reason: null,
          last_seen_at: null,
          last_seen_ip_hash: null,
          last_seen_user_agent_hash: null,
          metadata: {},
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'snippet-2',
          capability_token_id: 'cap-token-2',
          fields: { displayName: true },
          theme: 'auto',
          format: 'card',
          profile_type: 'organization',
          org_id: orgId,
          expires_at: null,
          created_at: '2026-02-12T10:00:00.000Z',
        },
      ]);

    const response = await POST(
      buildRequest({
        profileType: 'organization',
        orgId,
        fields: { displayName: true },
        theme: 'auto',
        format: 'card',
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.snippet.profileType).toBe('organization');
    expect(body.snippet.orgId).toBe(orgId);
    expect(body.snippet.canonicalPackId).toBeNull();
    expect(body.snippet.shareToken).toEqual(expect.any(String));
    expect(db.execute).toHaveBeenCalledTimes(4);
  });

  it('returns 403 when a non-member tries to create an organization snippet', async () => {
    (db.execute as any).mockResolvedValueOnce([]);

    const response = await POST(
      buildRequest({
        profileType: 'organization',
        orgId,
        fields: { displayName: true },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toContain('active member');
    expect(db.execute).toHaveBeenCalledTimes(1);
  });
});
