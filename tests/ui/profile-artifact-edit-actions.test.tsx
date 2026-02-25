import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ImpactTab } from '@/components/profile/editable-profile/ImpactTab';
import { JourneyTab } from '@/components/profile/editable-profile/JourneyTab';

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));

vi.mock('@/components/ui/tabs', () => ({
  TabsContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

describe('profile artifact edit actions', () => {
  it('calls onEditStory from Impact tab card action', () => {
    const onEditStory = vi.fn();

    render(
      <ImpactTab
        impactStories={[
          {
            id: 'impact-1',
            title: 'Impact title',
            orgDescription: 'Org',
            impact: 'Impact',
            businessValue: 'Business value',
            outcomes: 'Outcomes',
            timeline: '2024',
            verified: false,
            roleTitle: 'Lead',
            roleScope: 'owned',
            primaryCause: 'education',
            secondaryCauses: [],
            measuredOutcomes: [],
            supportingArtifacts: [],
          },
        ]}
        onAddStory={vi.fn()}
        onEditStory={onEditStory}
        onDeleteStory={vi.fn()}
        actionsDisabled={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /edit impact title/i }));

    expect(onEditStory).toHaveBeenCalledTimes(1);
    expect(onEditStory.mock.calls[0][0].id).toBe('impact-1');
  });

  it('calls onEditExperience from Journey tab card action', () => {
    const onEditExperience = vi.fn();

    render(
      <JourneyTab
        experiences={[
          {
            id: 'exp-1',
            title: 'Experience title',
            orgDescription: 'Org',
            duration: '2022 - 2024',
            outcomes: 'Outcomes',
            projects: 'Projects',
            colleagues: 'Colleagues',
            achievements: 'Achievements',
            verified: false,
          },
        ]}
        onAddExperience={vi.fn()}
        onEditExperience={onEditExperience}
        onDeleteExperience={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /edit experience title/i }));

    expect(onEditExperience).toHaveBeenCalledTimes(1);
    expect(onEditExperience.mock.calls[0][0].id).toBe('exp-1');
  });
});
