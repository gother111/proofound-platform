import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { GET } from '@/app/api/match/visible-fields/[matchId]/route';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('match visible fields route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', email: 'person@example.com' } },
          error: null,
        }),
      },
    } as any);
  });

  it('applies schema-compatible visibility settings', async () => {
    (db.execute as any)
      .mockResolvedValueOnce([{ id: 'match-1', organization_id: 'org-1', role: 'Engineer' }])
      .mockResolvedValueOnce([{ display_name: 'Person Name', avatar_url: null }])
      .mockResolvedValueOnce([
        {
          headline: 'Senior Engineer',
          bio: 'Profile bio',
          skills: ['TypeScript'],
          location: 'Stockholm',
          linkedin_profile_url: 'https://linkedin.com/in/person',
        },
      ])
      .mockResolvedValueOnce([{ comp_min: 90000, comp_max: 120000, currency: 'USD' }])
      .mockResolvedValueOnce([
        {
          display_name: 'private',
          headline: 'public',
          location: 'network_only',
          skills: 'public',
        },
      ])
      .mockResolvedValueOnce([{ display_name: 'Proofound Org' }]);

    const res = await GET(new NextRequest('http://localhost/api/match/visible-fields/match-1'), {
      params: Promise.resolve({ matchId: 'match-1' }),
    });
    const payload = await res.json();

    expect(res.status).toBe(200);
    const byField = new Map(payload.visibleFields.map((field: any) => [field.field, field]));
    expect(byField.get('name')?.isRedacted).toBe(true);
    expect(byField.get('headline')?.isRedacted).toBe(false);
    expect(byField.get('location')?.isRedacted).toBe(false);
    expect(byField.has('values')).toBe(false);
    expect(byField.has('causes')).toBe(false);
    expect(byField.get('compensation')?.value).toBe('Compensation overlap only');
    expect(byField.get('compensation')?.isRedacted).toBe(false);
  });

  it('fails closed for sensitive fields when visibility resolution fails', async () => {
    let callIndex = 0;
    (db.execute as any).mockImplementation(async () => {
      callIndex += 1;
      if (callIndex === 1) return [{ id: 'match-1', organization_id: 'org-1', role: 'Engineer' }];
      if (callIndex === 2) return [{ display_name: 'Person Name', avatar_url: null }];
      if (callIndex === 3) {
        return [
          {
            headline: 'Senior Engineer',
            bio: 'Profile bio',
            skills: ['TypeScript'],
            location: 'Stockholm',
            linkedin_profile_url: 'https://linkedin.com/in/person',
          },
        ];
      }
      if (callIndex === 4) return [{ comp_min: 90000, comp_max: 120000, currency: 'USD' }];
      if (callIndex === 5) throw new Error('visibility lookup failed');
      return [{ display_name: 'Proofound Org' }];
    });

    const res = await GET(new NextRequest('http://localhost/api/match/visible-fields/match-1'), {
      params: Promise.resolve({ matchId: 'match-1' }),
    });
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.visibleFields.length).toBeGreaterThan(0);
    expect(payload.visibleFields.every((field: any) => field.isRedacted === true)).toBe(true);
  });
});
