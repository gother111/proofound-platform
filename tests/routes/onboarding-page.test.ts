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
  OnboardingClient: ({ initialPersona }: { initialPersona: string | null }) => null,
}));

import OnboardingPage from '@/app/onboarding/page';

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
    });

    await expect(OnboardingPage()).rejects.toThrow('NEXT_REDIRECT');

    expect(getIndividualProfileCompletionStateMock).toHaveBeenCalledWith('user-1');
    expect(resolveUserHomePathMock).toHaveBeenCalledWith(supabase);
    expect(redirectMock).toHaveBeenCalledWith('/app/i/home');
  });

  it('shows individual onboarding for users who have not completed the core profile steps', async () => {
    getIndividualProfileCompletionStateMock.mockResolvedValue({
      isCoreProfileComplete: false,
    });

    const result = await OnboardingPage();

    expect(result).toMatchObject({
      props: { initialPersona: 'individual' },
    });
    expect(resolveUserHomePathMock).not.toHaveBeenCalled();
  });
});
