import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ContextTab } from '@/components/profile/editable-profile/ContextTab';
import { Tabs } from '@/components/ui/tabs';
import { START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_SURFACE } from '@/lib/ai/start-from-cv-contract';

vi.mock('@/components/profile/StartFromCvDialog', () => ({
  StartFromCvDialog: ({ onApplyComplete }: { onApplyComplete?: () => void }) => (
    <div data-testid="start-from-cv-dialog">
      <button type="button" onClick={() => onApplyComplete?.()}>
        mock-apply-start-from-cv
      </button>
    </div>
  ),
}));

const startFromCvStatus = vi.hoisted(() => ({
  visible: false,
  available: false,
  blockers: [] as string[],
}));

vi.mock('@/hooks/useStartFromCvBetaStatus', () => ({
  useStartFromCvBetaStatus: () => startFromCvStatus,
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
  afterEach(() => {
    startFromCvStatus.visible = false;
    startFromCvStatus.available = false;
    startFromCvStatus.blockers = [];
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('hides Start from CV when the beta flag is off', () => {
    startFromCvStatus.visible = false;
    startFromCvStatus.available = false;

    renderContextTab({ ...baseProps, onImportComplete: vi.fn() });

    expect(screen.queryByRole('button', { name: /Start from CV/i })).not.toBeInTheDocument();
  });

  it('keeps Start from CV hidden from generic profile context even when beta status is available', () => {
    startFromCvStatus.visible = true;
    startFromCvStatus.available = true;

    renderContextTab({ ...baseProps, onImportComplete: vi.fn() });

    expect(screen.queryByRole('button', { name: /Start from CV/i })).not.toBeInTheDocument();
  });

  it('opens Start from CV only from an explicitly approved private scaffolding surface', async () => {
    const onImportComplete = vi.fn();
    startFromCvStatus.visible = true;
    startFromCvStatus.available = true;

    renderContextTab({
      ...baseProps,
      cvScaffoldingSurface: START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_SURFACE,
      onImportComplete,
    });

    fireEvent.click(screen.getAllByRole('button', { name: /Start from CV/i })[0]);

    expect(await screen.findByTestId('start-from-cv-dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'mock-apply-start-from-cv' }));

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

  it('confirms private context deletion in-app without a browser confirm', () => {
    const onDeleteExperience = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderContextTab({
      ...baseProps,
      experiences: [
        {
          id: 'exp-1',
          title: 'Product Lead',
          organizationName: 'Acme',
          orgDescription: 'Led onboarding delivery',
          duration: '2020 - 2024',
          outcomes: 'Reduced support load',
          projects: 'Onboarding workflow',
          colleagues: 'Product and support',
          achievements: 'Launch owner',
          verified: false,
        },
      ],
      onDeleteExperience,
    });

    fireEvent.click(screen.getByRole('button', { name: /Delete Product Lead/i }));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Delete Product Lead?' })).toBeInTheDocument();
    expect(screen.getByText(/removes this private work context/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Proof Packs, verification records, and privacy settings/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Keep context/i }));
    expect(onDeleteExperience).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Delete Product Lead/i }));
    fireEvent.click(screen.getByRole('button', { name: /Delete work context/i }));

    expect(onDeleteExperience).toHaveBeenCalledTimes(1);
    expect(onDeleteExperience).toHaveBeenCalledWith('exp-1');
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('groups private context by supported type and surfaces proof signals', () => {
    renderContextTab({
      ...baseProps,
      experiences: [
        {
          id: 'exp-1',
          title: 'Product Lead',
          organizationName: 'Acme',
          orgDescription: 'Led onboarding delivery',
          duration: '2020 - 2024',
          outcomes: 'Reduced support load',
          projects: 'Onboarding workflow',
          colleagues: 'Product and support',
          achievements: 'Launch owner',
          measuredOutcomes: [
            { id: 'outcome-1', name: 'Support tickets reduced', value: 23, unit: '%' },
          ],
          verified: true,
        },
      ],
      education: [
        {
          id: 'edu-1',
          institution: 'KTH',
          degree: 'MSc Data Science',
          duration: '2018 - 2020',
          skills: 'Model evaluation',
          projects: 'Capstone model audit',
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
          impact: 'Mentored 12 students',
          skillsDeployed: 'Workshop facilitation',
          personalWhy: 'Local access',
          verified: false,
        },
      ],
    });

    expect(screen.getByRole('heading', { name: 'Work' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Volunteering' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Education / learning' })).toBeInTheDocument();
    expect(screen.getByText(/Support tickets reduced.*23 %/)).toBeInTheDocument();
    expect(screen.getByText('Claimed outcome')).toBeInTheDocument();
    expect(screen.getByText('Not independently verified')).toBeInTheDocument();
    expect(screen.getByText('Model evaluation')).toBeInTheDocument();
    expect(screen.getByText('Mentored 12 students')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Proof Packs/i })).toHaveLength(3);
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });
});
