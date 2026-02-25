import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EditableProfileView } from '@/components/profile/EditableProfileView';
import { useProfileData } from '@/hooks/useProfileData';

const toastInfoMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
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

vi.mock('@/components/profile/editable-profile/ProfileSidebar', () => ({
  ProfileSidebar: ({ onOpenMission, onOpenVision, onOpenValues, onOpenCauses }: any) => (
    <div data-testid="profile-sidebar">
      <button onClick={onOpenMission}>sidebar-open-mission</button>
      <button onClick={onOpenVision}>sidebar-open-vision</button>
      <button onClick={onOpenValues}>sidebar-open-values</button>
      <button onClick={onOpenCauses}>sidebar-open-causes</button>
    </div>
  ),
}));

vi.mock('@/components/profile/EmptyProfileStateView', () => ({
  EmptyProfileStateView: ({ onOpenMission, onOpenValues, onOpenCauses }: any) => (
    <div data-testid="empty-profile-state">
      <button onClick={onOpenMission}>empty-open-mission</button>
      <button onClick={onOpenValues}>empty-open-values</button>
      <button onClick={onOpenCauses}>empty-open-causes</button>
    </div>
  ),
}));

vi.mock('@/components/profile/editable-profile/ProfileDialogs', () => ({
  ProfileDialogs: ({
    isMissionEditorOpen,
    isVisionEditorOpen,
    isValuesEditorOpen,
    isCausesEditorOpen,
  }: any) => (
    <div data-testid="profile-dialogs">
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
    addVolunteering: vi.fn(),
    deleteVolunteering: vi.fn(),
    toggleRedactMode: vi.fn(),
  } as any);
}

describe('EditableProfileView purpose gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens values editor first from empty-state mission action when values are missing', () => {
    mockUseProfileData(
      createProfile({
        basicInfo: { name: 'Test User', avatar: null, tagline: '' },
      })
    );

    render(<EditableProfileView />);

    fireEvent.click(screen.getByRole('button', { name: 'empty-open-mission' }));

    expect(screen.getByTestId('empty-profile-state')).toBeInTheDocument();
    expect(screen.getByTestId('values-editor-open')).toBeInTheDocument();
    expect(toastInfoMock).toHaveBeenCalledWith(
      'Add at least one value before editing your mission. Values and causes must be completed first.'
    );
  });

  it('opens values editor from empty-state values action', () => {
    mockUseProfileData(
      createProfile({
        basicInfo: { name: 'Test User', avatar: null, tagline: '' },
      })
    );

    render(<EditableProfileView />);

    fireEvent.click(screen.getByRole('button', { name: 'empty-open-values' }));

    expect(screen.getByTestId('empty-profile-state')).toBeInTheDocument();
    expect(screen.getByTestId('values-editor-open')).toBeInTheDocument();
  });

  it('opens causes editor from empty-state causes action', () => {
    mockUseProfileData(
      createProfile({
        basicInfo: { name: 'Test User', avatar: null, tagline: '' },
      })
    );

    render(<EditableProfileView />);

    fireEvent.click(screen.getByRole('button', { name: 'empty-open-causes' }));

    expect(screen.getByTestId('empty-profile-state')).toBeInTheDocument();
    expect(screen.getByTestId('causes-editor-open')).toBeInTheDocument();
  });

  it('opens causes editor first when values exist but causes are missing', () => {
    mockUseProfileData(
      createProfile({
        values: [{ id: 'v1', label: 'Integrity', icon: 'shield' }],
        causes: [],
      })
    );

    render(<EditableProfileView />);

    fireEvent.click(screen.getByRole('button', { name: 'sidebar-open-vision' }));

    expect(screen.getByTestId('causes-editor-open')).toBeInTheDocument();
    expect(screen.queryByTestId('vision-editor-open')).not.toBeInTheDocument();
    expect(toastInfoMock).toHaveBeenCalledWith(
      'Add at least one cause before editing your vision. Values and causes must be completed first.'
    );
  });

  it('opens mission and vision editors when both values and causes exist', () => {
    mockUseProfileData(
      createProfile({
        values: [{ id: 'v1', label: 'Integrity', icon: 'shield' }],
        causes: ['Climate Justice'],
      })
    );

    render(<EditableProfileView />);

    fireEvent.click(screen.getByRole('button', { name: 'sidebar-open-mission' }));
    fireEvent.click(screen.getByRole('button', { name: 'sidebar-open-vision' }));

    expect(screen.getByTestId('mission-editor-open')).toBeInTheDocument();
    expect(screen.getByTestId('vision-editor-open')).toBeInTheDocument();
    expect(toastInfoMock).not.toHaveBeenCalled();
  });
});
