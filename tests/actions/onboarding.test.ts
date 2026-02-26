import { beforeEach, describe, expect, it, vi } from 'vitest';
import { completeIndividualOnboarding, completeOrganizationOnboarding } from '@/actions/onboarding';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { reconcileVerifierContradictions } from '@/lib/verification/contradiction';

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/verification/contradiction', () => ({
  reconcileVerifierContradictions: vi.fn(),
}));

describe('onboarding actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    (requireAuth as any).mockResolvedValue({ id: 'user-1' });
  });

  it('returns individual public portfolio URL and applies day-1 privacy defaults', async () => {
    const profileEq = vi.fn().mockResolvedValue({ error: null });
    const profileUpdate = vi.fn().mockReturnValue({ eq: profileEq });
    const individualUpsert = vi.fn().mockResolvedValue({ error: null });

    (createClient as any).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return { update: profileUpdate };
        }
        if (table === 'individual_profiles') {
          return { upsert: individualUpsert };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const formData = new FormData();
    formData.set('displayName', 'Jane Founder');
    formData.set('handle', 'Jane_Founder');
    formData.set('headline', 'Builder');

    const result = await completeIndividualOnboarding(formData);

    expect(result).toEqual({
      success: true,
      handle: 'jane_founder',
      publicPortfolioUrl: 'https://proofound.io/portfolio/jane_founder',
    });

    expect(individualUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        visibility: 'public',
        field_visibility: expect.objectContaining({
          contact: false,
          workEmail: false,
        }),
      })
    );
    expect(reconcileVerifierContradictions).toHaveBeenCalledWith({
      verifierProfileId: 'user-1',
    });
    expect(revalidatePath).toHaveBeenCalledWith('/portfolio/jane_founder');
  });

  it('returns organization public portfolio URL and seeds day-1 org visibility defaults', async () => {
    const orgInsert = vi.fn().mockResolvedValue({ error: null });
    const memberInsert = vi.fn().mockResolvedValue({ error: null });
    const personaEq = vi.fn().mockResolvedValue({ error: null });
    const profileUpdate = vi.fn().mockReturnValue({ eq: personaEq });
    const visibilityUpsert = vi.fn().mockResolvedValue({ error: null });

    const organizationMembersTable = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: memberInsert,
    };

    const organizationsTable = {
      insert: orgInsert,
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    (createClient as any).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'organization_members') {
          return organizationMembersTable;
        }
        if (table === 'organizations') {
          return organizationsTable;
        }
        if (table === 'profiles') {
          return { update: profileUpdate };
        }
        if (table === 'organization_field_visibility') {
          return { upsert: visibilityUpsert };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const formData = new FormData();
    formData.set('displayName', 'Acme Impact');
    formData.set('slug', 'acme-impact');
    formData.set('type', 'company');

    const result = await completeOrganizationOnboarding(formData);

    expect(result).toEqual({
      success: true,
      orgSlug: 'acme-impact',
      publicPortfolioUrl: 'https://proofound.io/portfolio/org/acme-impact',
    });

    expect(visibilityUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        display_name: 'public',
        mission: 'public',
        vision: 'public',
        causes: 'public',
        work_culture: 'internal_only',
      })
    );
    expect(revalidatePath).toHaveBeenCalledWith('/portfolio/org/acme-impact');
  });
});
