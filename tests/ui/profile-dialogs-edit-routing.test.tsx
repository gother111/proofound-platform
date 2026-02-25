import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ProfileDialogs } from '@/components/profile/editable-profile/ProfileDialogs';

vi.mock('@/components/profile/EditProfileModal', () => ({
  EditProfileModal: () => null,
}));
vi.mock('@/components/profile/MissionEditor', () => ({
  MissionEditor: () => null,
}));
vi.mock('@/components/profile/VisionEditor', () => ({
  VisionEditor: () => null,
}));
vi.mock('@/components/profile/ValuesEditor', () => ({
  ValuesEditor: () => null,
}));
vi.mock('@/components/profile/CausesEditor', () => ({
  CausesEditor: () => null,
}));
vi.mock('@/components/profile/ImpactStoryForm', () => ({
  ImpactStoryForm: () => null,
}));
vi.mock('@/components/profile/forms/ExperienceForm', () => ({
  ExperienceForm: () => null,
}));
vi.mock('@/components/profile/ShareProfileDialog', () => ({
  ShareProfileDialog: () => null,
}));
vi.mock('@/components/profile/forms/EducationForm', () => ({
  EducationForm: ({ onSave }: any) => (
    <button
      type="button"
      onClick={() =>
        onSave({
          institution: 'Updated Institute',
          degree: 'Updated Degree',
          duration: '2020 - 2022',
          skills: 'React',
          projects: 'Updated project',
          verified: false,
        })
      }
    >
      save-education
    </button>
  ),
}));
vi.mock('@/components/profile/forms/VolunteerForm', () => ({
  VolunteerForm: ({ onSave }: any) => (
    <button
      type="button"
      onClick={() =>
        onSave({
          title: 'Updated Volunteer',
          orgDescription: 'Org',
          duration: '2022 - Present',
          cause: 'Cause',
          impact: 'Impact',
          skillsDeployed: 'React',
          personalWhy: 'Why',
          verified: false,
        })
      }
    >
      save-volunteer
    </button>
  ),
}));

describe('ProfileDialogs edit routing', () => {
  it('routes education/volunteering save to update handlers when edit targets are set', () => {
    const onAddEducation = vi.fn();
    const onUpdateEducation = vi.fn();
    const onAddVolunteering = vi.fn();
    const onUpdateVolunteering = vi.fn();

    render(
      <ProfileDialogs
        profile={{
          basicInfo: {
            name: 'User',
            tagline: null,
            location: null,
            joinedDate: 'January 2026',
            avatar: null,
            coverImage: null,
          },
          mission: null,
          vision: null,
          values: [],
          causes: [],
          skills: [{ id: 'skill-1', name: 'React', verified: false }],
          impactStories: [],
          experiences: [],
          education: [],
          volunteering: [],
          fieldVisibility: {},
          redactMode: false,
        }}
        isEditProfileOpen={false}
        setIsEditProfileOpen={() => {}}
        isMissionEditorOpen={false}
        setIsMissionEditorOpen={() => {}}
        isVisionEditorOpen={false}
        setIsVisionEditorOpen={() => {}}
        isValuesEditorOpen={false}
        setIsValuesEditorOpen={() => {}}
        isCausesEditorOpen={false}
        setIsCausesEditorOpen={() => {}}
        isImpactStoryFormOpen={false}
        setIsImpactStoryFormOpen={() => {}}
        isExperienceFormOpen={false}
        setIsExperienceFormOpen={() => {}}
        isEducationFormOpen={true}
        setIsEducationFormOpen={() => {}}
        isVolunteerFormOpen={true}
        setIsVolunteerFormOpen={() => {}}
        isShareDialogOpen={false}
        setIsShareDialogOpen={() => {}}
        editingEducation={{
          id: 'edu-1',
          institution: 'Institute',
          degree: 'Degree',
          duration: '2018 - 2020',
          skills: 'Legacy',
          projects: 'Project',
          verified: false,
        }}
        editingVolunteering={{
          id: 'vol-1',
          title: 'Volunteer',
          orgDescription: 'Org',
          duration: '2022 - Present',
          cause: 'Cause',
          impact: 'Impact',
          skillsDeployed: 'Legacy',
          personalWhy: 'Why',
          verified: false,
        }}
        availableSkillNames={['React']}
        onUpdateBasicInfo={() => {}}
        onUpdateMission={() => {}}
        onUpdateVision={() => {}}
        onReplaceValues={() => {}}
        onReplaceCauses={() => {}}
        onAddImpactStory={() => {}}
        onAddExperience={() => {}}
        onAddEducation={onAddEducation}
        onUpdateEducation={onUpdateEducation}
        onAddVolunteering={onAddVolunteering}
        onUpdateVolunteering={onUpdateVolunteering}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'save-education' }));
    fireEvent.click(screen.getByRole('button', { name: 'save-volunteer' }));

    expect(onUpdateEducation).toHaveBeenCalledTimes(1);
    expect(onUpdateEducation.mock.calls[0][0]).toBe('edu-1');
    expect(onAddEducation).not.toHaveBeenCalled();

    expect(onUpdateVolunteering).toHaveBeenCalledTimes(1);
    expect(onUpdateVolunteering.mock.calls[0][0]).toBe('vol-1');
    expect(onAddVolunteering).not.toHaveBeenCalled();
  });
});
