import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ProfileSidebar } from '@/components/profile/editable-profile/ProfileSidebar';
import { ProfileView } from '@/components/profile/ProfileView';
import type { ProfileData } from '@/types/profile';

const profileData: ProfileData = {
  basicInfo: {
    name: 'Jane Doe',
    tagline: 'Impact-driven builder',
    location: 'Stockholm',
    joinedDate: 'January 2026',
    avatar: null,
    coverImage: null,
  },
  mission: 'Build trustworthy products for people.',
  vision: 'Make privacy-first products the default.',
  values: [{ id: 'v1', icon: 'Heart', label: 'Integrity', verified: true }],
  causes: ['Digital Rights'],
  skills: [{ id: 's1', name: 'TypeScript', verified: true }],
  impactStories: [],
  experiences: [],
  education: [],
  volunteering: [],
  fieldVisibility: {},
  redactMode: false,
};

describe('Profile skills block removal', () => {
  it('does not render a skills block in the editable profile sidebar', () => {
    render(
      <ProfileSidebar
        profile={profileData}
        onOpenMission={() => {}}
        onOpenVision={() => {}}
        onOpenValues={() => {}}
        onOpenCauses={() => {}}
      />
    );

    expect(screen.getByText('Mission')).toBeInTheDocument();
    expect(screen.getByText('Core Values')).toBeInTheDocument();
    expect(screen.getByText('Causes')).toBeInTheDocument();
    expect(screen.queryByText('Skills')).not.toBeInTheDocument();
    expect(screen.queryByText('Skills & Expertise')).not.toBeInTheDocument();
    expect(screen.queryByText('Manage in Expertise Atlas')).not.toBeInTheDocument();
  });

  it('does not render a skills block in the legacy profile view', () => {
    render(
      <ProfileView
        data={{
          profile: {
            displayName: 'Jane Doe',
            location: 'Stockholm',
            joinedDate: 'January 2026',
            avatarUrl: null,
            tagline: 'Impact-driven builder',
            verified: true,
            mission: 'Build trustworthy products for people.',
            values: [{ icon: 'Heart', label: 'Integrity', verified: true }],
            causes: ['Digital Rights'],
            skills: ['TypeScript'],
          },
          impactStories: [],
          experiences: [],
          education: [],
          volunteering: [],
        }}
      />
    );

    expect(screen.getByText('Mission')).toBeInTheDocument();
    expect(screen.getByText('Core Values')).toBeInTheDocument();
    expect(screen.getByText('Causes')).toBeInTheDocument();
    expect(screen.queryByText('Skills')).not.toBeInTheDocument();
    expect(screen.queryByText('Skills & Expertise')).not.toBeInTheDocument();
    expect(screen.queryByText('Manage in Expertise Atlas')).not.toBeInTheDocument();
  });
});
