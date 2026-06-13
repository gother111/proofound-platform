import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AssignmentBuilderPage from '@/app/app/o/[slug]/assignments/new/page';
import AssignmentBuilderClient from '@/app/app/o/[slug]/assignments/new/AssignmentBuilderClient';
import { __resetCsrfCacheForTests } from '@/lib/api/fetch';

let mockDraftId: string | null = null;

const pushMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
const dispatchClientErrorDiagnosticMock = vi.fn();

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

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: (...args: unknown[]) => dispatchClientErrorDiagnosticMock(...args),
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

async function renderAssignmentBuilderPage() {
  return AssignmentBuilderPage({
    params: Promise.resolve({ slug: 'acme' }),
  });
}

type FetchFixture = {
  draftAssignment?: Record<string, unknown> | null;
  failDraftLoadOnce?: boolean;
  failDraftSaveOnce?: boolean;
  failReviewSaveOnce?: boolean;
};

function setupFetch({
  draftAssignment = null,
  failDraftLoadOnce = false,
  failDraftSaveOnce = false,
  failReviewSaveOnce = false,
}: FetchFixture = {}) {
  let draftLoadAttempts = 0;
  let draftSaveAttempts = 0;
  let reviewSaveAttempts = 0;

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const requestUrl = new URL(url, 'http://localhost');
    const requestPath = requestUrl.pathname;
    const isAssignmentDetailRequest = /^\/api\/assignments\/[^/]+$/.test(requestPath);

    if (requestPath === '/api/csrf-token') {
      return {
        ok: true,
        json: async () => ({ token: 'csrf-token' }),
      };
    }

    if (
      mockDraftId &&
      requestPath === `/api/assignments/${mockDraftId}` &&
      (!init || init.method === undefined)
    ) {
      draftLoadAttempts += 1;

      if (failDraftLoadOnce && draftLoadAttempts === 1) {
        return {
          ok: false,
          json: async () => ({ error: 'Draft temporarily unavailable' }),
        };
      }

      return {
        ok: true,
        json: async () => ({ assignment: draftAssignment }),
      };
    }

    if (
      requestPath === '/api/assignments' ||
      (isAssignmentDetailRequest && init?.method === 'PUT')
    ) {
      const requestBody =
        typeof init?.body === 'string' ? JSON.parse(init.body) : (init?.body ?? {});
      const isReviewSave = requestBody.creationStatus === 'review_ready';

      if (isReviewSave) {
        reviewSaveAttempts += 1;
        if (failReviewSaveOnce && reviewSaveAttempts === 1) {
          return {
            ok: false,
            json: async () => ({ message: 'Review save temporarily unavailable' }),
          };
        }
      } else {
        draftSaveAttempts += 1;
        if (failDraftSaveOnce && draftSaveAttempts === 1) {
          return {
            ok: false,
            json: async () => ({ message: 'Draft save temporarily unavailable' }),
          };
        }
      }

      return {
        ok: true,
        json: async () => ({
          assignment: {
            id: mockDraftId || 'draft-1',
            orgId: 'org-1',
            status: requestBody.status,
            creationStatus: requestBody.creationStatus,
          },
        }),
      };
    }

    if (
      (mockDraftId && requestPath === `/api/assignments/${mockDraftId}/outcomes`) ||
      requestPath === '/api/assignments/draft-1/outcomes'
    ) {
      return {
        ok: true,
        json: async () => ({ outcomes: [] }),
      };
    }

    if (
      (mockDraftId && requestPath === `/api/assignments/${mockDraftId}/expertise-matrix`) ||
      requestPath === '/api/assignments/draft-1/expertise-matrix'
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
    __resetCsrfCacheForTests();
    mockDraftId = null;
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('renders the lean five-step corridor and hides advanced controls', async () => {
    setupFetch();

    render(await renderAssignmentBuilderPage());

    expect(await screen.findByText(/lean assignment corridor/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create from scratch/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /import existing assignment brief/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId('assignment-demo-path')).toHaveTextContent(/start.*middle.*finish/i);
    expect(screen.getByText(/what this assignment path proves/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /The company turns a vague role into measurable outcomes and proof-based requirements/i
      )
    ).toBeInTheDocument();
    expect(screen.getAllByText('Why this role exists').length).toBeGreaterThan(0);
    expect(screen.getAllByText('What work will actually be done').length).toBeGreaterThan(0);
    expect(screen.getAllByText('What proof would count').length).toBeGreaterThan(0);
    expect(screen.getAllByText('What practical constraints are real').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Internal review and publish').length).toBeGreaterThan(0);
    expect(screen.queryByTestId('advanced-mode-opt-in')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Advanced' })).not.toBeInTheDocument();
    expect(screen.queryByText('Weight Matrix')).not.toBeInTheDocument();
  });

  it('imports a pasted job description into structured draft fields without saving the source blob', async () => {
    const fetchMock = setupFetch();
    const pastedJobDescription = `
Title: Partner Launch Operations Lead

About the role:
We need this person to make partner onboarding reliable before the first pilot expansion. The role exists to turn vague launch requests into a repeatable proof-backed operating cadence.

Responsibilities:
- Own partner onboarding runbooks and launch readiness reviews.
- Coordinate product, support, and founder updates every week.
- Improve the handoff from signed partner to live proof review.

Outcomes:
- Launch the first three partners with clean readiness evidence within 90 days.
- Reduce manual launch follow-up by half within 6 months.

Requirements:
- Partner operations
- Program management
- SaaS implementation

Preferred:
- Startup customer success

Proof:
Portfolio examples should show comparable rollout ownership, stakeholder coordination, and measured launch outcomes.

Location: Stockholm, Sweden
Compensation: USD 80000 - 110000
Full-time
`;

    render(await renderAssignmentBuilderPage());

    fireEvent.click(
      await screen.findByRole('button', { name: /import existing assignment brief/i })
    );
    fireEvent.change(screen.getByLabelText(/existing assignment brief/i), {
      target: { value: pastedJobDescription },
    });
    fireEvent.click(screen.getByRole('button', { name: /convert to structured draft/i }));

    expect(await screen.findByText(/imported draft ready for review/i)).toBeInTheDocument();
    expect(screen.getByText(/partner operations/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'next-step-1' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/assignments',
        expect.objectContaining({ method: 'POST' })
      );
    });

    const assignmentCreateCall = fetchMock.mock.calls.find(
      ([url, init]) => url === '/api/assignments' && init?.method === 'POST'
    );
    const body = JSON.parse(String(assignmentCreateCall?.[1]?.body));

    expect(body.title).toBe('Partner Launch Operations Lead');
    expect(body.rolePurpose).toContain('partner onboarding reliable');
    expect(body.description).toContain('Own partner onboarding runbooks');
    expect(body.description).not.toBe(pastedJobDescription);
    expect(body.proofExpectations).toContain('Portfolio examples');
    expect(body.mustHaveSkills).toHaveLength(3);
    expect(body.niceToHaveSkills).toHaveLength(1);
    expect(body.locationMode).toBe('hybrid');
    expect(body.city).toBe('Stockholm');
    expect(body.country).toBe('Sweden');
    expect(body.compMin).toBe(80000);
    expect(body.compMax).toBe(110000);
    expect(JSON.stringify(body)).not.toContain('Full-time');
  });

  it('shows useful guidance instead of importing very short pasted text', async () => {
    setupFetch();

    render(await renderAssignmentBuilderPage());

    fireEvent.click(
      await screen.findByRole('button', { name: /import existing assignment brief/i })
    );
    const importTextarea = screen.getByLabelText(/existing assignment brief/i);
    fireEvent.change(importTextarea, {
      target: { value: 'Need a strong operator.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /convert to structured draft/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Import needs a fuller brief');
    expect(alert).toHaveTextContent(/too short to turn into a useful assignment draft/i);
    expect(screen.getByText(/Paste the full assignment brief/i)).toBeInTheDocument();
    expect(screen.getByText(/Best conversion input includes/i)).toBeInTheDocument();
    expect(screen.getByText(/Role title and why this assignment matters/i)).toBeInTheDocument();
    expect(screen.getByText('Proof expectations', { selector: 'li' })).toBeInTheDocument();
    expect(screen.queryByText(/Paste the full job description/i)).not.toBeInTheDocument();

    fireEvent.change(importTextarea, {
      target: { value: 'Title: Partner launch lead\nOutcomes: Launch three partners.' },
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('advances through the lean corridor and ends in internal review routing', async () => {
    setupFetch();

    render(await renderAssignmentBuilderPage());

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

  it('blocks editing and lets the user retry when an existing draft fails to load', async () => {
    mockDraftId = 'draft-1';
    setupFetch({
      failDraftLoadOnce: true,
      draftAssignment: {
        id: 'draft-1',
        orgId: 'org-1',
        role: 'Founding operator',
        businessValue: 'Tighten proof quality',
        description: 'Run the day-to-day assignment and review loop.',
        expectedImpact: '',
        outcomes: [],
        requiredSkills: [],
      },
    });

    render(await renderAssignmentBuilderPage());

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Draft did not load');
    expect(alert).toHaveTextContent('Retry loading before editing');
    expect(screen.queryByText('Step 1 content')).not.toBeInTheDocument();

    fireEvent.click(within(alert).getByRole('button', { name: 'Retry draft load' }));

    expect(await screen.findByText('Step 2 content')).toBeInTheDocument();
  });

  it('keeps draft save failures safe, visible, and retryable without losing the current step', async () => {
    setupFetch({ failDraftSaveOnce: true });

    render(await renderAssignmentBuilderPage());

    fireEvent.click(await screen.findByRole('button', { name: 'next-step-1' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Draft was not saved');
    expect(alert).toHaveTextContent(
      'Your changes are still on this page. Retry the draft save before moving on.'
    );
    expect(alert).not.toHaveTextContent('Draft save temporarily unavailable');
    expect(screen.getByText('Step 1 content')).toBeInTheDocument();
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'assignment_builder.client.draft_save_failed',
      expect.any(Error)
    );
    expect((dispatchClientErrorDiagnosticMock.mock.calls[0]?.[1] as Error).message).toBe(
      'Draft save temporarily unavailable'
    );

    fireEvent.click(within(alert).getByRole('button', { name: 'Retry draft save' }));

    expect(await screen.findByText('Step 2 content')).toBeInTheDocument();
  });

  it('keeps review-save failures safe, visible, and retryable before routing to review', async () => {
    setupFetch({ failReviewSaveOnce: true });

    render(await renderAssignmentBuilderPage());

    fireEvent.click(await screen.findByRole('button', { name: 'next-step-1' }));
    expect(await screen.findByText('Step 2 content')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'next-step-2' }));
    expect(await screen.findByText('Step 3 content')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'next-step-3' }));
    expect(await screen.findByText('Step 4 content')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'continue-to-review' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Assignment was not saved for review');
    expect(alert).toHaveTextContent(
      'Your draft is still on this page. Retry before leaving for internal review.'
    );
    expect(alert).not.toHaveTextContent('Review save temporarily unavailable');
    expect(pushMock).not.toHaveBeenCalled();
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'assignment_builder.client.review_save_failed',
      expect.any(Error)
    );
    expect((dispatchClientErrorDiagnosticMock.mock.calls[0]?.[1] as Error).message).toBe(
      'Review save temporarily unavailable'
    );

    fireEvent.click(within(alert).getByRole('button', { name: 'Retry review save' }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/app/o/acme/assignments/draft-1/review');
    });
  });

  it('ignores duplicate next clicks while a draft save is already in flight', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.startsWith('/api/csrf-token')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ token: 'csrf-token' }),
        });
      }

      if (url === '/api/assignments' && init?.method === 'POST') {
        return new Promise(() => {});
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, outcomes: [] }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(await renderAssignmentBuilderPage());

    const nextButton = await screen.findByRole('button', { name: 'next-step-1' });
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.filter(
          ([url, init]) => url === '/api/assignments' && init?.method === 'POST'
        )
      ).toHaveLength(1);
    });
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

    render(await renderAssignmentBuilderPage());

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

    render(await renderAssignmentBuilderPage());

    expect(await screen.findByText('Step 3 content')).toBeInTheDocument();
  });

  it('preserves active status when saving an existing published assignment from the editor', async () => {
    mockDraftId = 'active-1';
    const fetchMock = setupFetch({
      draftAssignment: {
        id: 'active-1',
        orgId: 'org-1',
        status: 'active',
        creationStatus: 'review_ready',
        role: 'Published operator',
        businessValue: 'Keep the live assignment available while editing.',
        description: 'Coordinate a published assignment.',
        expectedImpact: '',
        outcomes: [],
        requiredSkills: [],
      },
    });

    render(await renderAssignmentBuilderPage());

    expect(await screen.findByText('Step 2 content')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'next-step-2' }));

    await waitFor(() => {
      const updateCall = fetchMock.mock.calls.find(
        ([url, init]) => url === '/api/assignments/active-1' && init?.method === 'PUT'
      );
      expect(updateCall).toBeTruthy();
      expect(JSON.parse(String(updateCall?.[1]?.body))).toMatchObject({
        status: 'active',
        creationStatus: 'review_ready',
      });
    });
  });

  it('deduplicates hydrated outcomes before saving an existing assignment', async () => {
    mockDraftId = 'active-1';
    const fetchMock = setupFetch({
      draftAssignment: {
        id: 'active-1',
        orgId: 'org-1',
        status: 'active',
        role: 'Published operator',
        businessValue: 'Keep the live assignment available while editing.',
        description: 'Coordinate a published assignment.',
        expectedImpact: 'Strong proof from prior assignment delivery.',
        outcomes: [
          { metric: 'TTFQI', target: '72h', timeframe: '1 week' },
          { metric: 'TTFQI', target: '72h', timeframe: '1 week' },
        ],
        requiredSkills: [],
      },
    });

    render(await renderAssignmentBuilderPage());

    expect(await screen.findByText('Step 3 content')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'next-step-3' }));

    await waitFor(() => {
      const outcomesCall = fetchMock.mock.calls.find(
        ([url, init]) =>
          new URL(String(url), 'http://localhost').pathname ===
            '/api/assignments/active-1/outcomes' && init?.method === 'POST'
      );
      expect(outcomesCall).toBeTruthy();
      expect(JSON.parse(String(outcomesCall?.[1]?.body)).outcomes).toHaveLength(1);
    });
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

    render(await renderAssignmentBuilderPage());

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

    const { rerender } = render(await renderAssignmentBuilderPage());
    expect(await screen.findByText('Step 3 content')).toBeInTheDocument();

    mockDraftId = null;
    rerender(await renderAssignmentBuilderPage());

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
      const requestPath = new URL(url, 'http://localhost').pathname;

      if (requestPath === '/api/assignments/draft-1' && (!init || init.method === undefined)) {
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

    render(await renderAssignmentBuilderPage());

    await act(async () => {
      await Promise.resolve();
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/assignments/draft-1?orgSlug=acme');

    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(
      fetchMock.mock.calls.some(([, init]) => init && (init as RequestInit).method === 'PUT')
    ).toBe(false);
  });

  it('surfaces auto-save failures without blocking the current draft', async () => {
    vi.useFakeTimers();
    mockDraftId = 'draft-1';

    setupFetch({
      failDraftSaveOnce: true,
      draftAssignment: {
        id: 'draft-1',
        orgId: 'org-1',
        role: 'Founding operator',
        businessValue: 'Tighten proof quality',
        description: 'Run the day-to-day assignment and review loop.',
        expectedImpact: '',
        outcomes: [],
        requiredSkills: [],
      },
    });

    render(<AssignmentBuilderClient slug="acme" />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText('Step 2 content')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000);
    });

    expect(screen.getByRole('status')).toHaveTextContent('Auto-save did not finish');
    expect(screen.getByRole('status')).toHaveTextContent('use Next to save before leaving');
    expect(screen.getByText('Step 2 content')).toBeInTheDocument();
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'assignment_builder.client.auto_save_failed',
      expect.any(Error)
    );

    fireEvent.click(screen.getByRole('button', { name: 'next-step-2' }));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText('Step 3 content')).toBeInTheDocument();
    expect(screen.queryByText(/Auto-save did not finish/i)).not.toBeInTheDocument();
  });
});
