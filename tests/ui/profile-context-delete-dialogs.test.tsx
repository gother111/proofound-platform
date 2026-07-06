import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { JourneySection } from '@/components/profile/editable-profile/JourneyTab';
import { LearningSection } from '@/components/profile/editable-profile/LearningTab';
import { ServiceSection } from '@/components/profile/editable-profile/ServiceTab';
import type { Education, Experience, Volunteering } from '@/types/profile';

const learningContext: Education = {
  id: 'edu-1',
  institution: 'Proofound Lab',
  degree: 'Evidence Systems Program',
  duration: '2024',
  skills: 'Evidence modeling, rubric design',
  projects: 'Proof-backed hiring rubric',
  verified: false,
};

const workContext: Experience = {
  id: 'exp-1',
  title: 'Proof Operations Lead',
  organizationName: 'Nordic Field Systems',
  orgDescription: 'B2B operations team',
  duration: '2023 - 2025',
  outcomes: 'Reduced review cycle time',
  projects: 'Candidate evidence review workflow',
  colleagues: 'Product and operations',
  achievements: 'Launched pilot review process',
  verified: false,
};

const volunteeringContext: Volunteering = {
  id: 'vol-1',
  title: 'Community Mentor',
  orgDescription: 'Open mentoring circle',
  duration: '2022 - 2024',
  cause: 'Career access',
  impact: 'Supported first portfolio launches',
  skillsDeployed: 'Coaching, review, facilitation',
  personalWhy: 'Helped people turn work into proof.',
  verified: false,
};

describe('profile context delete dialogs', () => {
  let confirmSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens a learning delete dialog and lets the user keep the context', () => {
    const onDeleteEducation = vi.fn();

    render(
      <LearningSection
        education={[learningContext]}
        onAddEducation={vi.fn()}
        onEditEducation={vi.fn()}
        onDeleteEducation={onDeleteEducation}
      />
    );

    const deleteButton = screen.getByRole('button', { name: 'Delete Evidence Systems Program' });
    expect(deleteButton.parentElement).toHaveClass(
      'opacity-100',
      'sm:group-focus-within:opacity-100'
    );

    fireEvent.click(deleteButton);

    const dialog = screen.getByRole('alertdialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Delete learning context?' })
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/Evidence Systems Program/i)).toBeInTheDocument();
    expect(
      within(dialog).getByText(/Proof Packs, verification records, and privacy settings/i)
    ).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Keep context' }));

    expect(onDeleteEducation).not.toHaveBeenCalled();
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('confirms work context deletion without a browser confirm', () => {
    const onDeleteExperience = vi.fn();

    render(
      <JourneySection
        experiences={[workContext]}
        onAddExperience={vi.fn()}
        onEditExperience={vi.fn()}
        onDeleteExperience={onDeleteExperience}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete Proof Operations Lead' }));

    const dialog = screen.getByRole('alertdialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Delete work context?' })
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/Proof Operations Lead/i)).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete context' }));

    expect(onDeleteExperience).toHaveBeenCalledTimes(1);
    expect(onDeleteExperience).toHaveBeenCalledWith('exp-1');
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('confirms volunteering context deletion without changing proof records copy', () => {
    const onDeleteService = vi.fn();

    render(
      <ServiceSection
        volunteering={[volunteeringContext]}
        onAddService={vi.fn()}
        onEditService={vi.fn()}
        onDeleteService={onDeleteService}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete Community Mentor' }));

    const dialog = screen.getByRole('alertdialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Delete volunteering context?' })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/Your Proof Packs, verification records, and privacy settings/i)
    ).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete context' }));

    expect(onDeleteService).toHaveBeenCalledTimes(1);
    expect(onDeleteService).toHaveBeenCalledWith('vol-1');
    expect(confirmSpy).not.toHaveBeenCalled();
  });
});
