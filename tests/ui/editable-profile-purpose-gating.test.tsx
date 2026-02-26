import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EditableProfileView } from '@/components/profile/EditableProfileView';
import { useProfileData } from '@/hooks/useProfileData';

const toastInfoMock = vi.fn();
const pushMock = vi.fn();
const replaceMock = vi.fn();
let searchParamsState = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
  useSearchParams: () => searchParamsState,
  usePathname: () => '/app/i/profile',
}));

vi.mock('sonner', () => ({
  toast: {
    info: (...args: unknown[]) => toastInfoMock(...args),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/hooks/useProfileData', () => ({
  useProfileData: vi.fn(),
}));

vi.mock('@/components/profile/ProfileSkeleton', () => ({
  ProfileSkeleton: () => <div data-testid="profile-skeleton" />,
}));

vi.mock('@/components/profile/editable-profile/ProfileCompletionBanner', () => ({
  ProfileCompletionBanner: () => <div data-testid="profile-completion-banner" />,
}));

vi.mock('@/components/profile/editable-profile/ProfileHeroSection', () => ({
  ProfileHeroSection: () => <div data-testid="profile-hero-section" />,
}));

vi.mock('@/components/profile/editable-profile/ProfileTabsSection', () => ({
  ProfileTabsSection: () => <div data-testid="profile-tabs-section" />,
}));

vi.mock('@/components/profile/MobileProfileHeader', () => ({
  MobileProfileHeader: () => <div data-testid="mobile-profile-header" />,
}));

vi.mock('@/components/profile/GuidedProfileSetupView', () => ({
  GuidedProfileSetupView: ({
    completionState,
    onEditProfile,
    onOpenFullProfile,
    onOpenValues,
    onOpenCauses,
  }: any) => (
    <div data-testid="guided-profile-setup" data-stage={completionState.stage}>
      <button onClick={onEditProfile}>guided-edit-profile</button>
      <button onClick={onOpenFullProfile}>guided-open-full-profile</button>
      <button onClick={onOpenValues}>guided-open-values</button>
      <button onClick={onOpenCauses}>guided-open-causes</button>
    </div>
  ),
}));

vi.mock('@/components/profile/editable-profile/PortfolioReadinessChecklist', () => ({
  PortfolioReadinessChecklist: () => <div data-testid="portfolio-readiness-checklist" />,
}));

vi.mock('@/components/profile/editable-profile/ProfileSidebar', () => ({
  ProfileSidebar: ({ onOpenMission, onOpenVision }: any) => (
    <div data-testid="profile-sidebar">
      <button onClick={onOpenMission}>sidebar-open-mission</button>
      <button onClick={onOpenVision}>sidebar-open-vision</button>
    </div>
  ),
}));

vi.mock('@/components/profile/editable-profile/ProfileDialogs', () => ({
  ProfileDialogs: ({
    isEditProfileOpen,
    isMissionEditorOpen,
    isVisionEditorOpen,
    isValuesEditorOpen,
    isCausesEditorOpen,
  }: any) => (
    <div data-testid="profile-dialogs">
      {isEditProfileOpen && <span data-testid="edit-profile-open">edit-open</span>}
      {isMissionEditorOpen && <span data-testid="mission-editor-open">mission-open</span>}
      {isVisionEditorOpen && <span data-testid="vision-editor-open">vision-open</span>}
      {isValuesEditorOpen && <span data-testid="values-editor-open">values-open</span>}
      {isCausesEditorOpen && <span data-testid="causes-editor-open">causes-open</span>}
    </div>
  ),
}));

const useProfileDataMock = vi.mocked(useProfileData);

function createProfile(overrides: Partial<any> = {}) {
  return {
    basicInfo: {
      name: 'Test User',
      avatar: null,
      tagline: 'Builder',
    },
    mission: null,
    vision: null,
    values: [],
    causes: [],
    skills: [],
    proofArtifactCount: 0,
    acceptedVerificationCount: 0,
    impactStories: [],
    experiences: [],
    education: [],
    volunteering: [],
    ...overrides,
  };
}

function mockUseProfileData(profile: any) {
  useProfileDataMock.mockReturnValue({
    profile,
    isLoading: false,
    loadError: null,
    retryLoad: vi.fn(),
    isPending: false,
    pending: {
      updatingBasicInfo: false,
      mission: false,
      vision: false,
      values: false,
      causes: false,
      skills: false,
      impactStory: false,
      experience: false,
      education: false,
      volunteering: false,
      redactMode: false,
    },
    profileCompletion: 100,
    updateBasicInfo: vi.fn(),
    updateMission: vi.fn(),
    updateVision: vi.fn(),
    replaceValues: vi.fn(),
    replaceCauses: vi.fn(),
    addImpactStory: vi.fn(),
    deleteImpactStory: vi.fn(),
    addExperience: vi.fn(),
    deleteExperience: vi.fn(),
    addEducation: vi.fn(),
    deleteEducation: vi.fn(),
    updateEducation: vi.fn(),
    addVolunteering: vi.fn(),
    deleteVolunteering: vi.fn(),
    updateVolunteering: vi.fn(),
    toggleRedactMode: vi.fn(),
  } as any);
}

describe('EditableProfileView guided completion and purpose gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsState = new URLSearchParams();
  });

  it('shows guided Step 0 when name is missing and opens edit profile dialog', () => {
    mockUseProfileData(
      createProfile({
        basicInfo: { name: 'Your Name', avatar: null, tagline: '' },
      })
    );

    render(<EditableProfileView />);

    expect(screen.getByTestId('guided-profile-setup')).toHaveAttribute('data-stage', 'step0_name');
    fireEvent.click(screen.getByRole('button', { name: 'guided-edit-profile' }));
    expect(screen.getByTestId('edit-profile-open')).toBeInTheDocument();
  });

  it('shows guided Step 1 when values/causes are missing and opens editors', () => {
    mockUseProfileData(
      createProfile({
        basicInfo: { name: 'Jane Doe', avatar: null, tagline: '' },
        values: [],
        causes: [],
      })
    );

    render(<EditableProfileView />);

    expect(screen.getByTestId('guided-profile-setup')).toHaveAttribute(
      'data-stage',
      'step1_purpose'
    );

    fireEvent.click(screen.getByRole('button', { name: 'guided-open-values' }));
    expect(screen.getByTestId('values-editor-open')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'guided-open-causes' }));
    expect(screen.getByTestId('causes-editor-open')).toBeInTheDocument();
  });

  it('shows full profile view and opens mission/vision editors when prerequisites are met', () => {
    mockUseProfileData(
      createProfile({
        basicInfo: { name: 'Jane Doe', avatar: null, tagline: '' },
        values: [{ id: 'v1', label: 'Integrity', icon: 'shield' }],
        causes: ['Climate Justice'],
      })
    );

    render(<EditableProfileView />);

    expect(screen.queryByTestId('guided-profile-setup')).not.toBeInTheDocument();
    expect(screen.getByTestId('profile-sidebar')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'sidebar-open-mission' }));
    fireEvent.click(screen.getByRole('button', { name: 'sidebar-open-vision' }));

    expect(screen.getByTestId('mission-editor-open')).toBeInTheDocument();
    expect(screen.getByTestId('vision-editor-open')).toBeInTheDocument();
    expect(toastInfoMock).not.toHaveBeenCalled();
  });

  it('shows full profile when incomplete profile has profileView=full override', () => {
    searchParamsState = new URLSearchParams('profileView=full');
    mockUseProfileData(
      createProfile({
        basicInfo: { name: 'Jane Doe', avatar: null, tagline: '' },
        values: [],
        causes: [],
      })
    );

    render(<EditableProfileView />);

    expect(screen.queryByTestId('guided-profile-setup')).not.toBeInTheDocument();
    expect(screen.getByTestId('profile-sidebar')).toBeInTheDocument();
  });

  it('preserves query params and sets profileView=full when opening full profile from guided flow', () => {
    searchParamsState = new URLSearchParams('portfolioLocked=1&lockReason=purpose');
    mockUseProfileData(
      createProfile({
        basicInfo: { name: 'Jane Doe', avatar: null, tagline: '' },
        values: [],
        causes: [],
      })
    );

    render(<EditableProfileView />);

    fireEvent.click(screen.getByRole('button', { name: 'guided-open-full-profile' }));

    expect(replaceMock).toHaveBeenCalledTimes(1);
    const nextUrl = String(replaceMock.mock.calls[0][0]);
    expect(nextUrl.startsWith('/app/i/profile?')).toBe(true);
    expect(nextUrl).toContain('portfolioLocked=1');
    expect(nextUrl).toContain('lockReason=purpose');
    expect(nextUrl).toContain('profileView=full');
  });
});
