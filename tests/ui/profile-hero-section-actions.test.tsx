import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ProfileHeroSection } from '@/components/profile/editable-profile/ProfileHeroSection';
import type { ProfileData } from '@/types/profile';

vi.mock('fast-average-color', () => ({
  FastAverageColor: class {
    getColorAsync = vi.fn().mockResolvedValue({ value: [122, 146, 120] });
  },
}));

vi.mock('@/components/profile/AvatarUpload', () => ({
  AvatarUpload: ({
    avatar,
    onUpload,
  }: {
    avatar: string | null;
    onUpload: (value: string) => void;
  }) => (
    <button type="button" onClick={() => onUpload('data:image/png;base64,next-avatar')}>
      {avatar ? 'Change profile picture' : 'Upload profile picture'}
    </button>
  ),
}));

const profile: ProfileData = {
  basicInfo: {
    name: 'Jane Doe',
    tagline: 'Proof operations lead',
    location: 'Stockholm, Sweden',
    joinedDate: 'February 2026',
    avatar: null,
    coverImage: null,
  },
  mission: null,
  vision: null,
  values: [],
  causes: [],
  skills: [],
  proofArtifactCount: 1,
  acceptedVerificationCount: 1,
  publicProofCount: 1,
  publishedPortfolio: true,
  impactStories: [],
  experiences: [],
  education: [],
  volunteering: [],
  fieldVisibility: {},
  redactMode: false,
  guidedSetup: {
    handle: 'jane-doe',
    headline: 'Proof operations lead',
    timezone: 'Europe/Stockholm',
    desiredRoles: ['Proof operations'],
    workMode: 'remote',
    engagementType: 'contract',
  },
};

const pending = {
  updatingBasicInfo: false,
  redactMode: false,
};

function renderProfileHero(
  overrides: Partial<React.ComponentProps<typeof ProfileHeroSection>> = {}
) {
  const props: React.ComponentProps<typeof ProfileHeroSection> = {
    profile,
    isPending: false,
    pending,
    onEditProfile: vi.fn(),
    onToggleRedact: vi.fn(),
    onShare: vi.fn(),
    onUpdateBasicInfo: vi.fn(),
    ...overrides,
  };

  render(<ProfileHeroSection {...props} />);
  return props;
}

describe('ProfileHeroSection actions', () => {
  it('keeps profile header actions named and touch-safe', () => {
    renderProfileHero();

    expect(screen.getByRole('button', { name: 'Edit profile basics' })).toHaveClass('min-h-[44px]');
    expect(screen.getByRole('button', { name: 'Visible' })).toHaveClass('min-h-[44px]');
    expect(screen.getByRole('button', { name: 'Share' })).toHaveClass('min-h-[44px]');
  });

  it('announces and toggles redact mode as a pressed privacy control', () => {
    const onToggleRedact = vi.fn();
    renderProfileHero({ onToggleRedact });

    const visibleToggle = screen.getByRole('button', { name: 'Visible' });
    expect(visibleToggle).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(visibleToggle);

    expect(onToggleRedact).toHaveBeenCalledWith(true);
  });

  it('keeps hidden privacy mode pressed and touch-safe', () => {
    renderProfileHero({ profile: { ...profile, redactMode: true } });

    const hiddenToggle = screen.getByRole('button', { name: 'Hidden' });
    expect(hiddenToggle).toHaveAttribute('aria-pressed', 'true');
    expect(hiddenToggle).toHaveClass('min-h-[44px]');
  });
});
