import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AssignmentBuilderPage from '@/app/app/o/[slug]/assignments/new/page';

let mockDraftId: string | null = null;

const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
const toastInfoMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useParams: () => ({ slug: 'acme' }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'draftId' ? mockDraftId : null),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: any[]) => toastSuccessMock(...args),
    error: (...args: any[]) => toastErrorMock(...args),
    info: (...args: any[]) => toastInfoMock(...args),
  },
}));

vi.mock('@/lib/featureFlags', () => ({
  CLIENT_FF_DEFAULTS: {
    assignmentBasicMode: true,
  },
}));

vi.mock('@/lib/templates/prefill', () => ({
  mapTemplateToAssignmentForm: vi.fn(() => ({})),
}));

vi.mock('@/components/matching/assignment-steps', () => ({
  Step1BusinessValue: ({ onOpenTemplatePicker, templateAccessEnabled }: any) => (
    <div>
      {templateAccessEnabled ? (
        <button type="button" onClick={onOpenTemplatePicker}>
          Load template
        </button>
      ) : null}
    </div>
  ),
  Step2TargetOutcomes: () => <div>Step2</div>,
  Step3WeightMatrix: () => <div>Step3</div>,
  Step4Practicals: () => <div>Step4</div>,
  Step5ExpertiseMapping: () => <div>Step5</div>,
}));

vi.mock('@/components/matching/TemplatePicker', () => ({
  TemplatePicker: ({ open, templates, onApply }: any) =>
    open ? (
      <div data-testid="template-picker">
        {templates.map((template: any) => (
          <button key={template.id} type="button" onClick={() => onApply(template)}>
            Apply {template.name}
          </button>
        ))}
      </div>
    ) : null,
}));

type FetchFixture = {
  assignmentBasicMode?: boolean;
  templates?: Array<Record<string, unknown>>;
  draftAssignment?: Record<string, unknown> | null;
};

function setupFetch({
  assignmentBasicMode = true,
  templates = [],
  draftAssignment = null,
}: FetchFixture = {}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url === '/api/feature-flags') {
      return {
        ok: true,
        json: async () => ({ flags: { assignmentBasicMode } }),
      };
    }

    if (url.startsWith('/api/assignment-templates')) {
      return {
        ok: true,
        json: async () => ({ items: templates }),
      };
    }

    if (mockDraftId && url === `/api/assignments/${mockDraftId}` && draftAssignment) {
      return {
        ok: true,
        json: async () => ({ assignment: draftAssignment }),
      };
    }

    return {
      ok: true,
      json: async () => ({}),
    };
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('Assignment builder mode entry behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDraftId = null;
  });

  it('shows Basic by default with explicit Advanced opt-in CTA', async () => {
    setupFetch();

    render(<AssignmentBuilderPage />);

    expect(await screen.findByTestId('advanced-mode-opt-in')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Advanced' })).not.toBeInTheDocument();
    expect(screen.queryByText('Weight Matrix')).not.toBeInTheDocument();
  });

  it('reveals mode switch and advanced step after explicit opt-in, and allows switching back', async () => {
    setupFetch();

    render(<AssignmentBuilderPage />);

    fireEvent.click(await screen.findByTestId('advanced-mode-opt-in'));

    expect(screen.queryByTestId('advanced-mode-opt-in')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Advanced' })).toBeInTheDocument();
    expect(screen.getByText('Weight Matrix')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Basic' }));
    expect(screen.queryByText('Weight Matrix')).not.toBeInTheDocument();
  });

  it('keeps templates hidden until Advanced mode is explicitly enabled', async () => {
    setupFetch({
      templates: [
        {
          id: 'template-advanced',
          name: 'Advanced template',
          recommendedBuilderMode: 'advanced',
          presetPayload: {},
        },
      ],
    });

    render(<AssignmentBuilderPage />);

    expect(await screen.findByTestId('advanced-mode-opt-in')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load template' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('template-picker')).not.toBeInTheDocument();
    expect(screen.getByTestId('advanced-mode-opt-in')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Advanced' })).not.toBeInTheDocument();
    expect(screen.queryByText('Weight Matrix')).not.toBeInTheDocument();
    expect(toastInfoMock).not.toHaveBeenCalled();
  });

  it('loads existing advanced draft with advanced controls already unlocked', async () => {
    mockDraftId = 'draft-1';
    setupFetch({
      draftAssignment: {
        id: 'draft-1',
        orgId: 'org-1',
        builderMode: 'advanced',
        role: 'Senior Product Designer',
        businessValue: 'Improve onboarding conversion',
        expectedImpact: 'Increase completion by 20%',
        outcomes: [],
        weights: { mission: 33, expertise: 34, workMode: 33 },
        locationMode: 'hybrid',
        city: 'Stockholm',
        country: 'SE',
        compMin: 50000,
        compMax: 70000,
        currency: 'USD',
        hoursMin: 20,
        hoursMax: 40,
        verificationGates: [],
        requiredSkills: [],
        niceToHaveSkills: [],
      },
    });

    render(<AssignmentBuilderPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Advanced' })).toBeInTheDocument();
    });

    expect(screen.queryByTestId('advanced-mode-opt-in')).not.toBeInTheDocument();
    expect(screen.getByText('Weight Matrix')).toBeInTheDocument();
  });
});
