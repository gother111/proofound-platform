import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ContextTab } from '@/components/profile/editable-profile/ContextTab';
import { Tabs } from '@/components/ui/tabs';

vi.mock('@/components/expertise/cv-import/CvImportWizard', () => ({
  CvImportWizard: ({ onApplyComplete }: { onApplyComplete?: () => void }) => (
    <div data-testid="cv-import-wizard">
      <button type="button" onClick={() => onApplyComplete?.()}>
        mock-apply-cv-import
      </button>
    </div>
  ),
}));

const baseProps = {
  experiences: [],
  education: [],
  volunteering: [],
  onAddExperience: vi.fn(),
  onEditExperience: vi.fn(),
  onDeleteExperience: vi.fn(),
  onAddEducation: vi.fn(),
  onEditEducation: vi.fn(),
  onDeleteEducation: vi.fn(),
  onAddVolunteering: vi.fn(),
  onEditVolunteering: vi.fn(),
  onDeleteVolunteering: vi.fn(),
};

function renderContextTab(props: React.ComponentProps<typeof ContextTab>) {
  return render(
    <Tabs value="context">
      <ContextTab {...props} />
    </Tabs>
  );
}

describe('profile context CV import', () => {
  it('opens the CV import flow from the Context tab and refreshes after apply', () => {
    const onImportComplete = vi.fn();

    renderContextTab({ ...baseProps, onImportComplete });

    fireEvent.click(screen.getByRole('button', { name: /Import CV/i }));

    expect(screen.getByTestId('cv-import-wizard')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'mock-apply-cv-import' }));

    expect(onImportComplete).toHaveBeenCalledTimes(1);
  });

  it('keeps imported-looking context entries editable through the normal cards', () => {
    const onEditExperience = vi.fn();
    const onEditEducation = vi.fn();
    const onEditVolunteering = vi.fn();

    renderContextTab({
      ...baseProps,
      experiences: [
        {
          id: 'exp-1',
          title: 'Product Lead',
          organizationName: 'Acme',
          orgDescription: 'Organization details not specified',
          duration: '2020 - 2024',
          outcomes: 'Imported from CV',
          projects: 'Imported from CV',
          colleagues: 'Imported from CV wizard',
          achievements: 'Imported from CV',
          verified: false,
        },
      ],
      education: [
        {
          id: 'edu-1',
          institution: 'KTH',
          degree: 'MSc Data Science',
          duration: '2018 - 2020',
          skills: 'Imported from CV',
          projects: 'Imported from CV',
          verified: false,
        },
      ],
      volunteering: [
        {
          id: 'vol-1',
          title: 'Mentor',
          orgDescription: 'Code Club',
          duration: '2021 - 2022',
          cause: 'Community learning',
          impact: 'Imported from CV',
          skillsDeployed: 'Imported from CV',
          personalWhy: 'Imported from CV',
          verified: false,
        },
      ],
      onEditExperience,
      onEditEducation,
      onEditVolunteering,
    });

    fireEvent.click(screen.getByRole('button', { name: /Edit Product Lead/i }));
    fireEvent.click(screen.getByRole('button', { name: /Edit MSc Data Science/i }));
    fireEvent.click(screen.getByRole('button', { name: /Edit Mentor/i }));

    expect(onEditExperience).toHaveBeenCalledTimes(1);
    expect(onEditEducation).toHaveBeenCalledTimes(1);
    expect(onEditVolunteering).toHaveBeenCalledTimes(1);
  });
});
