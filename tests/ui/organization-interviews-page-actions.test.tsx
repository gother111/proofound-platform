import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import OrganizationInterviewsPage from '@/app/app/o/[slug]/interviews/page';
import { __resetCsrfCacheForTests } from '@/lib/api/fetch';

const { diagnosticMock } = vi.hoisted(() => ({
  diagnosticMock: vi.fn(),
}));

const getInterviewCorridorItemsMock = vi.fn();

vi.mock('@/app/actions/interviews', () => ({
  getInterviewCorridorItems: (...args: any[]) => getInterviewCorridorItemsMock(...args),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: (...args: unknown[]) => diagnosticMock(...args),
}));

vi.mock('@/components/ui/v2/AppSurface', () => ({
  AppSurface: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ asChild, children, ...props }: any) =>
    asChild && React.isValidElement(children) ? (
      React.cloneElement(children, props)
    ) : (
      <button {...props}>{children}</button>
    ),
}));

vi.mock('@/components/decisions/DecisionDialog', () => ({
  DecisionDialog: () => <div data-testid="decision-dialog" />,
}));

vi.mock('@/components/interviews/HiringCorridorTimeline', () => ({
  HiringCorridorTimeline: () => <div data-testid="corridor-timeline" />,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children, ...props }: any) => (
    <div role="dialog" aria-label="Dialog" {...props}>
      {children}
    </div>
  ),
  DialogHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogFooter: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
  DialogDescription: ({ children, ...props }: any) => <p {...props}>{children}</p>,
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ slug: 'acme' }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('organization interviews page actions', () => {
  const buildCorridor = (overrides: Record<string, unknown> = {}) => ({
    subjectLabel: 'Candidate',
    currentStep: 'interviews',
    nextAction: {
      id: 'wait_for_interview',
      label: 'Wait',
    },
    engagementVerification: null,
    ...overrides,
  });

  const buildInterviewItem = (overrides: Record<string, unknown> = {}) => ({
    id: 'match-1',
    matchId: 'match-1',
    assignmentTitle: 'Engineer',
    organizationName: 'Proofound',
    candidateDisplayName: 'Candidate',
    introAcceptedAt: new Date().toISOString(),
    interview: {
      id: 'interview-1',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      duration: 30,
      platform: 'manual',
      meetingUrl: 'https://example.com/manual-room',
      manualMeetingProvider: null,
      rescheduleCount: 0,
      status: 'scheduled',
      completedAt: null,
      cancelledAt: null,
      noShowAt: null,
    },
    corridor: buildCorridor(),
    decisionState: null,
    engagementVerification: null,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    __resetCsrfCacheForTests();
    getInterviewCorridorItemsMock.mockReset();
  });

  const getDiagnosticErrorMessage = (reason: string) => {
    const error = diagnosticMock.mock.calls.find(
      ([diagnosticReason]) => diagnosticReason === reason
    )?.[1];
    return error instanceof Error ? error.message : String(error);
  };

  it('explains the loading corridor before interview actions arrive', () => {
    getInterviewCorridorItemsMock.mockReturnValue(new Promise<never>(() => {}));

    render(<OrganizationInterviewsPage />);

    expect(
      screen.getByRole('heading', { name: 'Interview workflow is loading' })
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading proof-review interview workflow...'
    );
  });

  it('keeps load failures separate from the empty workflow state and retries', async () => {
    getInterviewCorridorItemsMock
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({ items: [] });

    render(<OrganizationInterviewsPage />);

    expect(
      await screen.findByRole('heading', { name: /interview workflow could not load/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /scheduled interviews, decisions, and engagement records are still safe\. retry this section to refresh the organization workflow\./i
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /no active interview workflow yet/i })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /retry interviews/i }));

    await waitFor(() => {
      expect(getInterviewCorridorItemsMock).toHaveBeenCalledTimes(2);
    });
    expect(
      await screen.findByRole('heading', { name: /no active interview workflow yet/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/once a proof submission moves into interview coordination/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /review assignment queue/i })).toHaveAttribute(
      'href',
      '/app/o/acme/assignments'
    );
  });

  it('makes scheduled interviews with pending meeting links explicit', async () => {
    getInterviewCorridorItemsMock.mockResolvedValue({
      items: [
        buildInterviewItem({
          interview: {
            id: 'interview-1',
            scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            duration: 30,
            platform: 'manual',
            meetingUrl: 'pending',
            manualMeetingProvider: 'teams',
            rescheduleCount: 0,
            status: 'scheduled',
            completedAt: null,
            cancelledAt: null,
            noShowAt: null,
          },
        }),
      ],
    });

    render(<OrganizationInterviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('Teams')).toBeInTheDocument();
    });

    expect(screen.getByText('Meeting link pending.')).toBeInTheDocument();
    expect(
      screen.getByText(/join and calendar controls appear once a usable meeting link is attached/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /join meeting/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /add to calendar/i })).not.toBeInTheDocument();
    expect(screen.queryByText('pending')).not.toBeInTheDocument();
  });

  it('uses in-app dialogs for interview outcome actions before refresh', async () => {
    const upcomingInterviewAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];

    getInterviewCorridorItemsMock.mockImplementation(async () => ({
      items: [
        buildInterviewItem({
          interview: {
            id: 'interview-1',
            scheduledAt: upcomingInterviewAt,
            duration: 30,
            platform: 'manual',
            meetingUrl: 'https://example.com/manual-room',
            manualMeetingProvider: null,
            rescheduleCount: 0,
            status: 'scheduled',
            completedAt: null,
            cancelledAt: null,
            noShowAt: null,
          },
        }),
      ],
    }));

    const confirmSpy = vi.fn();
    const promptSpy = vi.fn();
    vi.stubGlobal('confirm', confirmSpy);
    vi.stubGlobal('prompt', promptSpy);

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        fetchCalls.push({ url, init });

        if (url.startsWith('/api/csrf-token')) {
          return {
            ok: true,
            json: async () => ({ token: 'csrf-token' }),
          };
        }

        if (url === '/api/interviews/edit') {
          return {
            ok: true,
            json: async () => ({
              success: true,
            }),
          };
        }

        if (url === '/api/interviews/cancel') {
          return {
            ok: true,
            json: async () => ({
              success: true,
            }),
          };
        }

        if (url === '/api/interviews/complete') {
          return {
            ok: true,
            json: async () => ({
              success: true,
            }),
          };
        }

        if (url === '/api/interviews/no-show') {
          return {
            ok: true,
            json: async () => ({
              success: true,
            }),
          };
        }

        return { ok: false, json: async () => ({ error: 'Unexpected route' }) };
      })
    );

    render(<OrganizationInterviewsPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit interview/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel interview/i })).toBeInTheDocument();
    });
    expect(screen.getByText('Manual')).toBeInTheDocument();
    expect(screen.queryByText('zoom')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /edit interview/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(fetchCalls.some((call) => call.url === '/api/interviews/edit')).toBe(true);
    });

    fireEvent.click(screen.getByRole('button', { name: /cancel interview/i }));

    const cancelDialog = await screen.findByRole('dialog');
    expect(
      within(cancelDialog).getByText(/candidate and workflow record stay clear/i)
    ).toBeInTheDocument();
    expect(
      within(cancelDialog).getByText(/Cancellation changes the active interview workflow/i)
    ).toBeInTheDocument();
    fireEvent.change(within(cancelDialog).getByLabelText(/reason/i), {
      target: { value: 'Need to move due to conflict' },
    });
    fireEvent.click(within(cancelDialog).getByRole('button', { name: /^cancel interview$/i }));

    await waitFor(() => {
      expect(fetchCalls.some((call) => call.url === '/api/interviews/cancel')).toBe(true);
    });
    const cancelCall = fetchCalls.find((call) => call.url === '/api/interviews/cancel');
    expect(cancelCall?.init?.body).toBe(
      JSON.stringify({
        interviewId: 'interview-1',
        reason: 'Need to move due to conflict',
      })
    );
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(promptSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /mark complete/i }));

    const completeDialog = await screen.findByRole('dialog');
    expect(
      within(completeDialog).getByText(/The decision step becomes available next/i)
    ).toBeInTheDocument();
    expect(
      within(completeDialog).getByText(/Completion moves the corridor forward/i)
    ).toBeInTheDocument();
    fireEvent.click(
      within(completeDialog).getByRole('button', { name: /mark interview complete/i })
    );

    await waitFor(() => {
      expect(fetchCalls.some((call) => call.url === '/api/interviews/complete')).toBe(true);
    });
    const completeCall = fetchCalls.find((call) => call.url === '/api/interviews/complete');
    expect(completeCall?.init?.body).toBe(
      JSON.stringify({
        interviewId: 'interview-1',
      })
    );

    fireEvent.click(screen.getByRole('button', { name: /mark no-show/i }));

    const noShowDialog = await screen.findByRole('dialog');
    expect(
      within(noShowDialog).getByText(/replacement interview path is clear/i)
    ).toBeInTheDocument();
    expect(within(noShowDialog).getByText(/No-show pauses the decision path/i)).toBeInTheDocument();
    fireEvent.change(within(noShowDialog).getByLabelText(/reason/i), {
      target: { value: 'Candidate missed the scheduled call' },
    });
    fireEvent.click(within(noShowDialog).getByRole('button', { name: /record no-show/i }));

    await waitFor(() => {
      expect(fetchCalls.some((call) => call.url === '/api/interviews/no-show')).toBe(true);
    });
    const noShowCall = fetchCalls.find((call) => call.url === '/api/interviews/no-show');
    expect(noShowCall?.init?.body).toBe(
      JSON.stringify({
        interviewId: 'interview-1',
        reason: 'Candidate missed the scheduled call',
      })
    );
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(promptSpy).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(getInterviewCorridorItemsMock.mock.calls.length).toBeGreaterThanOrEqual(5);
    });
  });

  it('keeps failed interview edits visible and retryable', async () => {
    const upcomingInterviewAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    let editAttempts = 0;

    getInterviewCorridorItemsMock.mockResolvedValue({
      items: [
        buildInterviewItem({
          interview: {
            id: 'interview-1',
            scheduledAt: upcomingInterviewAt,
            duration: 30,
            platform: 'manual',
            meetingUrl: 'https://example.com/manual-room',
            manualMeetingProvider: null,
            rescheduleCount: 0,
            status: 'scheduled',
            completedAt: null,
            cancelledAt: null,
            noShowAt: null,
          },
        }),
      ],
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL) => {
        const url = typeof input === 'string' ? input : input.toString();

        if (url.startsWith('/api/csrf-token')) {
          return {
            ok: true,
            json: async () => ({ token: 'csrf-token' }),
          };
        }

        if (url === '/api/interviews/edit') {
          editAttempts += 1;

          if (editAttempts === 1) {
            return {
              ok: false,
              json: async () => ({
                error: 'Interview update is temporarily unavailable.',
              }),
            };
          }

          return {
            ok: true,
            json: async () => ({ success: true }),
          };
        }

        return { ok: false, json: async () => ({ error: 'Unexpected route' }) };
      })
    );

    render(<OrganizationInterviewsPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit interview/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /edit interview/i }));

    const editDialog = await screen.findByRole('dialog');
    const dateField = within(editDialog).getByLabelText('Date') as HTMLInputElement;
    const reasonField = within(editDialog).getByLabelText(/reason/i) as HTMLTextAreaElement;
    const originalDate = dateField.value;

    fireEvent.change(dateField, { target: { value: '' } });
    fireEvent.click(within(editDialog).getByRole('button', { name: /save changes/i }));

    let alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Choose a date and time');
    expect(alert).toHaveTextContent('Select both date and time before saving.');
    expect(editAttempts).toBe(0);

    fireEvent.change(dateField, { target: { value: originalDate } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    fireEvent.change(reasonField, {
      target: { value: 'Moving to the reviewer availability window' },
    });
    fireEvent.click(within(editDialog).getByRole('button', { name: /save changes/i }));

    alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Interview update could not be saved');
    expect(alert).toHaveTextContent(
      'The interview workflow is unchanged; review the time and retry before closing.'
    );
    expect(alert).not.toHaveTextContent('Interview update is temporarily unavailable.');
    expect(diagnosticMock).toHaveBeenCalledWith(
      'interviews.organization.edit_failed',
      expect.any(Error)
    );
    expect(getDiagnosticErrorMessage('interviews.organization.edit_failed')).toBe(
      'Interview update is temporarily unavailable.'
    );
    expect(reasonField).toHaveValue('Moving to the reviewer availability window');

    fireEvent.click(within(alert).getByRole('button', { name: /retry update/i }));

    await waitFor(() => {
      expect(editAttempts).toBe(2);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('keeps failed interview outcome dialogs visible and retryable', async () => {
    const upcomingInterviewAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const actionAttempts: Record<string, number> = {};

    getInterviewCorridorItemsMock.mockResolvedValue({
      items: [
        buildInterviewItem({
          interview: {
            id: 'interview-1',
            scheduledAt: upcomingInterviewAt,
            duration: 30,
            platform: 'manual',
            meetingUrl: 'https://example.com/manual-room',
            manualMeetingProvider: null,
            rescheduleCount: 0,
            status: 'scheduled',
            completedAt: null,
            cancelledAt: null,
            noShowAt: null,
          },
        }),
      ],
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL) => {
        const url = typeof input === 'string' ? input : input.toString();

        if (url.startsWith('/api/csrf-token')) {
          return {
            ok: true,
            json: async () => ({ token: 'csrf-token' }),
          };
        }

        if (
          url === '/api/interviews/cancel' ||
          url === '/api/interviews/complete' ||
          url === '/api/interviews/no-show'
        ) {
          actionAttempts[url] = (actionAttempts[url] ?? 0) + 1;

          if (actionAttempts[url] === 1) {
            return {
              ok: false,
              json: async () => ({
                error: `${url} is temporarily unavailable.`,
              }),
            };
          }

          return {
            ok: true,
            json: async () => ({ success: true }),
          };
        }

        return { ok: false, json: async () => ({ error: 'Unexpected route' }) };
      })
    );

    render(<OrganizationInterviewsPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancel interview/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /cancel interview/i }));
    const cancelDialog = await screen.findByRole('dialog');
    const cancelReasonField = within(cancelDialog).getByLabelText(/reason/i);
    fireEvent.change(cancelReasonField, {
      target: { value: 'Need to move due to conflict' },
    });
    fireEvent.click(within(cancelDialog).getByRole('button', { name: /^cancel interview$/i }));

    let alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Interview cancellation could not be recorded');
    expect(alert).toHaveTextContent(
      'The interview remains scheduled; review the reason and retry.'
    );
    expect(alert).not.toHaveTextContent('/api/interviews/cancel is temporarily unavailable.');
    expect(diagnosticMock).toHaveBeenCalledWith(
      'interviews.organization.cancel_failed',
      expect.any(Error)
    );
    expect(getDiagnosticErrorMessage('interviews.organization.cancel_failed')).toBe(
      '/api/interviews/cancel is temporarily unavailable.'
    );
    expect(cancelReasonField).toHaveValue('Need to move due to conflict');

    fireEvent.click(within(alert).getByRole('button', { name: /retry cancellation/i }));

    await waitFor(() => {
      expect(actionAttempts['/api/interviews/cancel']).toBe(2);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /mark complete/i }));
    const completeDialog = await screen.findByRole('dialog');
    fireEvent.click(
      within(completeDialog).getByRole('button', { name: /mark interview complete/i })
    );

    alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Interview completion could not be recorded');
    expect(alert).toHaveTextContent(
      'The corridor is unchanged; retry before recording a decision.'
    );
    expect(alert).not.toHaveTextContent('/api/interviews/complete is temporarily unavailable.');
    expect(diagnosticMock).toHaveBeenCalledWith(
      'interviews.organization.complete_failed',
      expect.any(Error)
    );
    expect(getDiagnosticErrorMessage('interviews.organization.complete_failed')).toBe(
      '/api/interviews/complete is temporarily unavailable.'
    );

    fireEvent.click(within(alert).getByRole('button', { name: /retry completion/i }));

    await waitFor(() => {
      expect(actionAttempts['/api/interviews/complete']).toBe(2);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /mark no-show/i }));
    const noShowDialog = await screen.findByRole('dialog');
    const noShowReasonField = within(noShowDialog).getByLabelText(/reason/i);
    fireEvent.change(noShowReasonField, {
      target: { value: 'Candidate missed the scheduled call' },
    });
    fireEvent.click(within(noShowDialog).getByRole('button', { name: /record no-show/i }));

    alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No-show could not be recorded');
    expect(alert).toHaveTextContent(
      'The interview workflow is unchanged; review the note and retry.'
    );
    expect(alert).not.toHaveTextContent('/api/interviews/no-show is temporarily unavailable.');
    expect(diagnosticMock).toHaveBeenCalledWith(
      'interviews.organization.no_show_failed',
      expect.any(Error)
    );
    expect(getDiagnosticErrorMessage('interviews.organization.no_show_failed')).toBe(
      '/api/interviews/no-show is temporarily unavailable.'
    );
    expect(noShowReasonField).toHaveValue('Candidate missed the scheduled call');

    fireEvent.click(within(alert).getByRole('button', { name: /retry no-show/i }));

    await waitFor(() => {
      expect(actionAttempts['/api/interviews/no-show']).toBe(2);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('renders decision and engagement status separately and confirms engagement after hire', async () => {
    const upcomingInterviewAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const initialInterview = buildInterviewItem({
      interview: {
        id: 'interview-1',
        scheduledAt: upcomingInterviewAt,
        duration: 30,
        platform: 'manual',
        meetingUrl: 'https://example.com/manual-room',
        manualMeetingProvider: null,
        rescheduleCount: 0,
        status: 'completed',
        completedAt: new Date().toISOString(),
        cancelledAt: null,
        noShowAt: null,
      },
      decisionState: 'hire',
      corridor: buildCorridor({
        nextAction: {
          id: 'confirm_engagement',
          label: 'Confirm engagement',
        },
        engagementVerification: {
          id: 'engagement-1',
          status: 'pending_both_confirmations',
          statusLabel: 'Awaiting both confirmations',
          engagementType: null,
          candidateConfirmedAt: null,
          organizationConfirmedAt: null,
          uploadedEvidencePresent: false,
          proofHookStatus: 'not_ready',
          verifiedAt: null,
        },
      }),
      engagementVerification: {
        id: 'engagement-1',
        status: 'pending_both_confirmations',
        statusLabel: 'Awaiting both confirmations',
        engagementType: null,
        createdAt: new Date().toISOString(),
        candidateConfirmedAt: null,
        organizationConfirmedAt: null,
        uploadedEvidencePresent: false,
        proofHookStatus: 'not_ready',
        verifiedAt: null,
      },
    });
    const confirmedInterview = {
      ...initialInterview,
      corridor: buildCorridor({
        nextAction: {
          id: 'wait_for_engagement_confirmation',
          label: 'Wait',
        },
        engagementVerification: {
          ...initialInterview.engagementVerification,
          status: 'pending_candidate_confirmation',
          statusLabel: 'Awaiting proof-review participant confirmation',
          engagementType: 'full_time',
          organizationConfirmedAt: new Date().toISOString(),
        },
      }),
      engagementVerification: {
        ...initialInterview.engagementVerification,
        status: 'pending_candidate_confirmation',
        statusLabel: 'Awaiting proof-review participant confirmation',
        engagementType: 'full_time',
        organizationConfirmedAt: new Date().toISOString(),
      },
    };
    const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];
    let loadCount = 0;

    getInterviewCorridorItemsMock.mockImplementation(async () => {
      loadCount += 1;
      return {
        items: [loadCount === 1 ? initialInterview : confirmedInterview],
      };
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        fetchCalls.push({ url, init });

        if (url.startsWith('/api/csrf-token')) {
          return {
            ok: true,
            json: async () => ({ token: 'csrf-token' }),
          };
        }

        if (url === '/api/engagement-verifications/engagement-1') {
          return {
            ok: true,
            json: async () => ({
              success: true,
              engagementVerification: confirmedInterview.engagementVerification,
            }),
          };
        }

        return { ok: false, json: async () => ({ error: 'Unexpected route' }) };
      })
    );

    render(<OrganizationInterviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('Decision: Hire')).toBeInTheDocument();
      expect(screen.getByText('Engagement: Awaiting both confirmations')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm engagement/i })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Engagement type'), {
      target: { value: 'full_time' },
    });
    fireEvent.click(screen.getByRole('button', { name: /confirm engagement/i }));

    await waitFor(() => {
      expect(
        fetchCalls.some((call) => call.url === '/api/engagement-verifications/engagement-1')
      ).toBe(true);
    });

    const engagementCall = fetchCalls.find(
      (call) => call.url === '/api/engagement-verifications/engagement-1'
    );

    expect(engagementCall?.init?.method).toBe('PATCH');
    expect(engagementCall?.init?.body).toBe(
      JSON.stringify({
        confirm: true,
        engagementType: 'full_time',
      })
    );

    await waitFor(() => {
      expect(
        screen.getByText('Engagement: Awaiting proof-review participant confirmation')
      ).toBeInTheDocument();
    });
  });

  it('keeps failed engagement confirmations visible and retryable', async () => {
    const upcomingInterviewAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const initialInterview = buildInterviewItem({
      interview: {
        id: 'interview-1',
        scheduledAt: upcomingInterviewAt,
        duration: 30,
        platform: 'manual',
        meetingUrl: 'https://example.com/manual-room',
        manualMeetingProvider: null,
        rescheduleCount: 0,
        status: 'completed',
        completedAt: new Date().toISOString(),
        cancelledAt: null,
        noShowAt: null,
      },
      decisionState: 'hire',
      corridor: buildCorridor({
        nextAction: {
          id: 'confirm_engagement',
          label: 'Confirm engagement',
        },
        engagementVerification: {
          id: 'engagement-1',
          status: 'pending_both_confirmations',
          statusLabel: 'Awaiting both confirmations',
          engagementType: null,
          candidateConfirmedAt: null,
          organizationConfirmedAt: null,
          uploadedEvidencePresent: false,
          proofHookStatus: 'not_ready',
          verifiedAt: null,
        },
      }),
      engagementVerification: {
        id: 'engagement-1',
        status: 'pending_both_confirmations',
        statusLabel: 'Awaiting both confirmations',
        engagementType: null,
        createdAt: new Date().toISOString(),
        candidateConfirmedAt: null,
        organizationConfirmedAt: null,
        uploadedEvidencePresent: false,
        proofHookStatus: 'not_ready',
        verifiedAt: null,
      },
    });
    const confirmedInterview = {
      ...initialInterview,
      corridor: buildCorridor({
        nextAction: {
          id: 'wait_for_engagement_confirmation',
          label: 'Wait',
        },
        engagementVerification: {
          ...initialInterview.engagementVerification,
          status: 'pending_candidate_confirmation',
          statusLabel: 'Awaiting proof-review participant confirmation',
          engagementType: 'full_time',
          organizationConfirmedAt: new Date().toISOString(),
        },
      }),
      engagementVerification: {
        ...initialInterview.engagementVerification,
        status: 'pending_candidate_confirmation',
        statusLabel: 'Awaiting proof-review participant confirmation',
        engagementType: 'full_time',
        organizationConfirmedAt: new Date().toISOString(),
      },
    };
    const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];
    let loadCount = 0;
    let engagementPatchCount = 0;

    getInterviewCorridorItemsMock.mockImplementation(async () => {
      loadCount += 1;
      return {
        items: [loadCount === 1 ? initialInterview : confirmedInterview],
      };
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        fetchCalls.push({ url, init });

        if (url.startsWith('/api/csrf-token')) {
          return {
            ok: true,
            json: async () => ({ token: 'csrf-token' }),
          };
        }

        if (url === '/api/engagement-verifications/engagement-1') {
          engagementPatchCount += 1;

          if (engagementPatchCount === 1) {
            return {
              ok: false,
              json: async () => ({
                error: 'Engagement confirmation is temporarily unavailable.',
              }),
            };
          }

          return {
            ok: true,
            json: async () => ({
              success: true,
              engagementVerification: confirmedInterview.engagementVerification,
            }),
          };
        }

        return { ok: false, json: async () => ({ error: 'Unexpected route' }) };
      })
    );

    render(<OrganizationInterviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('Engagement: Awaiting both confirmations')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm engagement/i })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Engagement type'), {
      target: { value: 'full_time' },
    });
    fireEvent.click(screen.getByRole('button', { name: /confirm engagement/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Engagement confirmation could not be recorded');
    expect(alert).toHaveTextContent('The engagement state is unchanged; retry before moving on.');
    expect(alert).not.toHaveTextContent('Engagement confirmation is temporarily unavailable.');
    expect(diagnosticMock).toHaveBeenCalledWith(
      'interviews.organization.engagement_confirm_failed',
      expect.any(Error)
    );
    expect(getDiagnosticErrorMessage('interviews.organization.engagement_confirm_failed')).toBe(
      'Engagement confirmation is temporarily unavailable.'
    );
    expect(screen.getByLabelText('Engagement type')).toHaveValue('full_time');

    fireEvent.click(within(alert).getByRole('button', { name: 'Retry confirmation' }));

    await waitFor(() => {
      expect(
        screen.getByText('Engagement: Awaiting proof-review participant confirmation')
      ).toBeInTheDocument();
    });

    expect(
      fetchCalls.filter((call) => call.url === '/api/engagement-verifications/engagement-1')
    ).toHaveLength(2);
  });

  it('shows reschedule history and blocks a second reschedule on the interviews surface', async () => {
    const upcomingInterviewAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    getInterviewCorridorItemsMock.mockResolvedValue({
      items: [
        buildInterviewItem({
          interview: {
            id: 'interview-1',
            scheduledAt: upcomingInterviewAt,
            duration: 30,
            platform: 'manual',
            meetingUrl: 'https://example.com/manual-room',
            manualMeetingProvider: null,
            rescheduleCount: 1,
            status: 'scheduled',
            completedAt: null,
            cancelledAt: null,
            noShowAt: null,
          },
        }),
      ],
    });

    render(<OrganizationInterviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('Rescheduled 1 time')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reschedule limit reached/i })).toBeDisabled();
    });
  });
});
