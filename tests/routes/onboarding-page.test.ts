import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  redirectMock,
  createClientMock,
  resolveUserHomePathMock,
  getPersonaMock,
  getUserOrganizationsMock,
  getCurrentUserMock,
  getIndividualProfileCompletionStateMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
  createClientMock: vi.fn(),
  resolveUserHomePathMock: vi.fn(),
  getPersonaMock: vi.fn(),
  getUserOrganizationsMock: vi.fn(),
  getCurrentUserMock: vi.fn(),
  getIndividualProfileCompletionStateMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}));

vi.mock('@/lib/auth', () => ({
  resolveUserHomePath: resolveUserHomePathMock,
  getPersona: getPersonaMock,
  getUserOrganizations: getUserOrganizationsMock,
  getCurrentUser: getCurrentUserMock,
}));

vi.mock('@/lib/profile/completion-flow.server', () => ({
  getIndividualProfileCompletionState: getIndividualProfileCompletionStateMock,
}));

vi.mock('@/components/onboarding/OnboardingClient', () => ({
  OnboardingClient: 'first-proof-onboarding',
}));

import OnboardingPage from '@/app/onboarding/page';
import { START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_SURFACE } from '@/lib/ai/start-from-cv-contract';

describe('OnboardingPage', () => {
  const supabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    createClientMock.mockResolvedValue(supabase);
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    resolveUserHomePathMock.mockResolvedValue('/app/i/home');
    getPersonaMock.mockResolvedValue('individual');
    getUserOrganizationsMock.mockResolvedValue([]);
    getCurrentUserMock.mockResolvedValue({ handle: null });
  });

  it('redirects legacy individual users without handles to the dashboard', async () => {
    getIndividualProfileCompletionStateMock.mockResolvedValue({
      isCoreProfileComplete: true,
      checks: { hasStructuredProofPack: true },
    });

    await expect(OnboardingPage({})).rejects.toThrow('NEXT_REDIRECT');

    expect(getIndividualProfileCompletionStateMock).toHaveBeenCalledWith('user-1');
    expect(resolveUserHomePathMock).toHaveBeenCalledWith(supabase);
    expect(redirectMock).toHaveBeenCalledWith('/app/i/home');
  });

  it('routes new individual users into first-proof onboarding instead of broad profile setup', async () => {
    getIndividualProfileCompletionStateMock.mockResolvedValue({
      isCoreProfileComplete: false,
      checks: { hasStructuredProofPack: false },
    });

    const result = await OnboardingPage({});

    expect(result).toMatchObject({
      type: 'first-proof-onboarding',
      props: {
        initialPersona: 'individual',
        startFromCvScaffoldingSurface: START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_SURFACE,
      },
    });
    expect(resolveUserHomePathMock).not.toHaveBeenCalled();
  });

  it('preserves candidate invite completion path while opening Start from CV scaffolding', async () => {
    getIndividualProfileCompletionStateMock.mockResolvedValue({
      isCoreProfileComplete: false,
      checks: { hasStructuredProofPack: false },
    });

    const result = await OnboardingPage({
      searchParams: Promise.resolve({ next: '/candidate-invite/token-value' }),
    });

    expect(result).toMatchObject({
      type: 'first-proof-onboarding',
      props: {
        initialPersona: 'individual',
        individualCompletionPath: '/candidate-invite/token-value',
        startFromCvScaffoldingSurface: START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_SURFACE,
      },
    });
  });

  it('keeps external next URLs from becoming completion paths while preserving CV scaffolding', async () => {
    getIndividualProfileCompletionStateMock.mockResolvedValue({
      isCoreProfileComplete: false,
      checks: { hasStructuredProofPack: false },
    });

    const result = await OnboardingPage({
      searchParams: Promise.resolve({ next: 'https://example.com/candidate-invite/token-value' }),
    });

    expect(result).toMatchObject({
      type: 'first-proof-onboarding',
      props: {
        initialPersona: 'individual',
        individualCompletionPath: undefined,
        startFromCvScaffoldingSurface: START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_SURFACE,
      },
    });
  });

  it('encodes legacy org slugs before redirecting unknown-persona users to org home', async () => {
    getPersonaMock.mockResolvedValue('unknown');
    getUserOrganizationsMock.mockResolvedValue([
      {
        org: {
          slug: 'acme/team',
        },
      },
    ]);

    await expect(OnboardingPage({})).rejects.toThrow('NEXT_REDIRECT');

    expect(redirectMock).toHaveBeenCalledWith('/app/o/acme%2Fteam/home');
  });
});
