import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AssignmentBuilderPage from '@/app/app/o/[slug]/assignments/new/page';

let mockDraftId: string | null = null;

const pushMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
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
  },
}));

vi.mock('@/components/matching/assignment-steps', () => ({
  Step1BusinessValue: ({ onNext, isSubmitting }: any) => (
    <div>
      <p>Step 1 content</p>
      <button type="button" onClick={onNext} disabled={isSubmitting}>
        next-step-1
      </button>
    </div>
  ),
  Step2TargetOutcomes: ({ onNext, onBack, isSubmitting }: any) => (
    <div>
      <p>Step 2 content</p>
      <button type="button" onClick={onBack} disabled={isSubmitting}>
        back-step-2
      </button>
      <button type="button" onClick={onNext} disabled={isSubmitting}>
        next-step-2
      </button>
    </div>
  ),
  Step3WeightMatrix: ({ onNext, onBack, isSubmitting }: any) => (
    <div>
      <p>Step 3 content</p>
      <button type="button" onClick={onBack} disabled={isSubmitting}>
        back-step-3
      </button>
      <button type="button" onClick={onNext} disabled={isSubmitting}>
        next-step-3
      </button>
    </div>
  ),
  Step4Practicals: ({ onNext, onBack, isSubmitting }: any) => (
    <div>
      <p>Step 4 content</p>
      <button type="button" onClick={onBack} disabled={isSubmitting}>
        back-step-4
      </button>
      <button type="button" onClick={onNext} disabled={isSubmitting}>
        continue-to-review
      </button>
    </div>
  ),
}));

type FetchFixture = {
  draftAssignment?: Record<string, unknown> | null;
};

function setupFetch({ draftAssignment = null }: FetchFixture = {}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const isAssignmentDetailRequest = /^\/api\/assignments\/[^/]+$/.test(url);

    if (
      mockDraftId &&
      url === `/api/assignments/${mockDraftId}` &&
      (!init || init.method === undefined)
    ) {
      return {
        ok: true,
        json: async () => ({ assignment: draftAssignment }),
      };
    }

    if (url === '/api/assignments' || (isAssignmentDetailRequest && init?.method === 'PUT')) {
      return {
        ok: true,
        json: async () => ({
          assignment: {
            id: mockDraftId || 'draft-1',
            orgId: 'org-1',
          },
        }),
      };
    }

    if (
      (mockDraftId && url === `/api/assignments/${mockDraftId}/outcomes`) ||
      url === '/api/assignments/draft-1/outcomes'
    ) {
      return {
        ok: true,
        json: async () => ({ outcomes: [] }),
      };
    }

    if (
      (mockDraftId && url === `/api/assignments/${mockDraftId}/expertise-matrix`) ||
      url === '/api/assignments/draft-1/expertise-matrix'
    ) {
      return {
        ok: true,
        json: async () => ({ success: true }),
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

describe('Assignment builder lean corridor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDraftId = null;
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('renders the lean five-step corridor and hides advanced controls', async () => {
    setupFetch();

    render(<AssignmentBuilderPage />);

    expect(await screen.findByText(/lean assignment corridor/i)).toBeInTheDocument();
    expect(screen.getByText('Why this role exists')).toBeInTheDocument();
    expect(screen.getByText('What work will actually be done')).toBeInTheDocument();
    expect(screen.getByText('What proof would count')).toBeInTheDocument();
    expect(screen.getByText('What practical constraints are real')).toBeInTheDocument();
    expect(screen.getByText('Internal review and publish')).toBeInTheDocument();
    expect(screen.queryByTestId('advanced-mode-opt-in')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Advanced' })).not.toBeInTheDocument();
    expect(screen.queryByText('Weight Matrix')).not.toBeInTheDocument();
  });

  it('advances through the lean corridor and ends in internal review routing', async () => {
    setupFetch();

    render(<AssignmentBuilderPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'next-step-1' }));
    expect(await screen.findByText('Step 2 content')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'next-step-2' }));
    expect(await screen.findByText('Step 3 content')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'next-step-3' }));
    expect(await screen.findByText('Step 4 content')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'continue-to-review' }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/app/o/acme/assignments/draft-1/review');
    });
    expect(toastSuccessMock).toHaveBeenCalledWith('Assignment saved for internal review');
  });

  it('ignores duplicate next clicks while a draft save is already in flight', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url === '/api/assignments' && init?.method === 'POST') {
        return new Promise(() => {});
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, outcomes: [] }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AssignmentBuilderPage />);

    const nextButton = await screen.findByRole('button', { name: 'next-step-1' });
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    expect(
      fetchMock.mock.calls.filter(
        ([url, init]) => url === '/api/assignments' && init?.method === 'POST'
      )
    ).toHaveLength(1);
  });

  it('hydrates an existing draft into the lean builder without showing legacy controls', async () => {
    mockDraftId = 'draft-1';
    setupFetch({
      draftAssignment: {
        id: 'draft-1',
        orgId: 'org-1',
        role: 'Founding operator',
        businessValue: 'Tighten proof quality',
        description: 'Run the day-to-day assignment and review loop.',
        expectedImpact: 'Strong proof from prior assignment delivery.',
        outcomes: [],
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

    expect(await screen.findByText(/lean assignment corridor/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Advanced' })).not.toBeInTheDocument();
    expect(screen.queryByText('Weight Matrix')).not.toBeInTheDocument();
  });

  it('resumes a hydrated draft at the first incomplete step', async () => {
    mockDraftId = 'draft-1';
    setupFetch({
      draftAssignment: {
        id: 'draft-1',
        orgId: 'org-1',
        role: 'Founding operator',
        businessValue: 'Tighten proof quality',
        description: 'Run the day-to-day assignment and review loop.',
        expectedImpact: 'Strong proof from prior assignment delivery.',
        outcomes: [{ metric: 'Launch evidence', target: '100%', timeframe: '1 week' }],
        requiredSkills: [],
      },
    });

    render(<AssignmentBuilderPage />);

    expect(await screen.findByText('Step 3 content')).toBeInTheDocument();
  });

  it('resumes a hydrated draft with fewer than three required skills at proof mapping', async () => {
    mockDraftId = 'draft-1';
    setupFetch({
      draftAssignment: {
        id: 'draft-1',
        orgId: 'org-1',
        role: 'Founding operator',
        businessValue: 'Tighten proof quality',
        description: 'Run the day-to-day assignment and review loop.',
        expectedImpact: 'Strong proof from prior assignment delivery.',
        outcomes: [{ metric: 'Launch evidence', target: '100%', timeframe: '1 week' }],
        requiredSkills: [
          { id: 'skill-1', label: 'Skill 1', level: 3 },
          { id: 'skill-2', label: 'Skill 2', level: 3 },
        ],
      },
    });

    render(<AssignmentBuilderPage />);

    expect(await screen.findByText('Step 3 content')).toBeInTheDocument();
  });

  it('resets stale draft state when navigating from a draft URL to a fresh builder URL', async () => {
    mockDraftId = 'draft-1';
    const fetchMock = setupFetch({
      draftAssignment: {
        id: 'draft-1',
        orgId: 'org-1',
        role: 'Founding operator',
        businessValue: 'Tighten proof quality',
        description: 'Run the day-to-day assignment and review loop.',
        expectedImpact: 'Strong proof from prior assignment delivery.',
        outcomes: [{ metric: 'Launch evidence', target: '100%', timeframe: '1 week' }],
        requiredSkills: [],
      },
    });

    const { rerender } = render(<AssignmentBuilderPage />);
    expect(await screen.findByText('Step 3 content')).toBeInTheDocument();

    mockDraftId = null;
    rerender(<AssignmentBuilderPage />);

    expect(await screen.findByText('Step 1 content')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'next-step-1' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/assignments',
        expect.objectContaining({ method: 'POST' })
      );
    });
    expect(
      fetchMock.mock.calls.some(
        ([url, init]) => url === '/api/assignments/draft-1' && init?.method === 'PUT'
      )
    ).toBe(false);
  });

  it('does not autosave an existing draft before hydration finishes', async () => {
    vi.useFakeTimers();
    mockDraftId = 'draft-1';

    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url === '/api/assignments/draft-1' && (!init || init.method === undefined)) {
        return new Promise(() => {});
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({
          assignment: {
            id: 'draft-1',
            orgId: 'org-1',
          },
        }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AssignmentBuilderPage />);

    await act(async () => {
      await Promise.resolve();
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/assignments/draft-1');

    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(
      fetchMock.mock.calls.some(([, init]) => init && (init as RequestInit).method === 'PUT')
    ).toBe(false);
  });
});
