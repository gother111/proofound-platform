import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import OrganizationInterviewsPage from '@/app/app/o/[slug]/interviews/page';
import { __resetCsrfCacheForTests } from '@/lib/api/fetch';

const getInterviewCorridorItemsMock = vi.fn();

vi.mock('@/app/actions/interviews', () => ({
  getInterviewCorridorItems: (...args: any[]) => getInterviewCorridorItemsMock(...args),
}));

vi.mock('@/components/ui/v2/AppSurface', () => ({
  AppSurface: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/decisions/DecisionDialog', () => ({
  DecisionDialog: () => <div data-testid="decision-dialog" />,
}));

vi.mock('@/components/interviews/HiringCorridorTimeline', () => ({
  HiringCorridorTimeline: () => <div data-testid="corridor-timeline" />,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
  DialogDescription: ({ children, ...props }: any) => <p {...props}>{children}</p>,
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
      platform: 'zoom',
      meetingUrl: 'https://zoom.us/j/example',
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

  it('explains the loading corridor before interview actions arrive', () => {
    getInterviewCorridorItemsMock.mockReturnValue(new Promise<never>(() => {}));

    render(<OrganizationInterviewsPage />);

    expect(
      screen.getByRole('heading', { name: 'Interview corridor is loading' })
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading interview corridor...');
  });

  it('shows edit/cancel actions and calls edit + cancel APIs with refresh', async () => {
    const upcomingInterviewAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];

    getInterviewCorridorItemsMock.mockImplementation(async () => ({
      items: [
        buildInterviewItem({
          interview: {
            id: 'interview-1',
            scheduledAt: upcomingInterviewAt,
            duration: 30,
            platform: 'zoom',
            meetingUrl: 'https://zoom.us/j/example',
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

    vi.stubGlobal(
      'confirm',
      vi.fn(() => true)
    );
    vi.stubGlobal(
      'prompt',
      vi.fn(() => 'Need to move due to conflict')
    );

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

        return { ok: false, json: async () => ({ error: 'Unexpected route' }) };
      })
    );

    render(<OrganizationInterviewsPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit interview/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel interview/i })).toBeInTheDocument();
    });
    expect(screen.getByText('Manual (Zoom)')).toBeInTheDocument();
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

    await waitFor(() => {
      expect(fetchCalls.some((call) => call.url === '/api/interviews/cancel')).toBe(true);
    });

    await waitFor(() => {
      expect(getInterviewCorridorItemsMock.mock.calls.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('renders decision and engagement status separately and confirms engagement after hire', async () => {
    const upcomingInterviewAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const initialInterview = buildInterviewItem({
      interview: {
        id: 'interview-1',
        scheduledAt: upcomingInterviewAt,
        duration: 30,
        platform: 'zoom',
        meetingUrl: 'https://zoom.us/j/example',
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
          statusLabel: 'Awaiting candidate confirmation',
          engagementType: 'full_time',
          organizationConfirmedAt: new Date().toISOString(),
        },
      }),
      engagementVerification: {
        ...initialInterview.engagementVerification,
        status: 'pending_candidate_confirmation',
        statusLabel: 'Awaiting candidate confirmation',
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
      expect(screen.getByText('Engagement: Awaiting candidate confirmation')).toBeInTheDocument();
    });
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
            platform: 'zoom',
            meetingUrl: 'https://zoom.us/j/example',
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
