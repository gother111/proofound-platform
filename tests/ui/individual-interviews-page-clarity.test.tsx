import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import InterviewsPage from '@/app/app/i/interviews/IndividualInterviewsPage';
import { __resetCsrfCacheForTests } from '@/lib/api/fetch';

const getInterviewCorridorItemsMock = vi.fn();

vi.mock('@/app/actions/interviews', () => ({
  getInterviewCorridorItems: (...args: any[]) => getInterviewCorridorItemsMock(...args),
}));

vi.mock('@/components/ui/v2/AppSurface', () => ({
  AppSurface: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/interviews/HiringCorridorTimeline', () => ({
  HiringCorridorTimeline: () => <div data-testid="corridor-timeline" />,
}));

vi.mock('@/lib/interviews/calendar', () => ({
  buildGoogleCalendarUrl: () => 'https://calendar.google.com/calendar/render',
  downloadInterviewIcs: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('individual interviews page clarity', () => {
  const buildCorridor = (overrides: Record<string, unknown> = {}) => ({
    subjectLabel: 'Nordic Future Labs',
    currentStep: 'interviews',
    nextAction: {
      id: 'prepare_for_interview',
      label: 'Prepare for interview',
      description: 'Keep the meeting details handy.',
    },
    engagementVerification: null,
    ...overrides,
  });

  const buildInterviewItem = (overrides: Record<string, unknown> = {}) => ({
    id: 'match-1',
    matchId: 'match-1',
    assignmentTitle: 'Evidence systems consultant',
    organizationName: 'Nordic Future Labs',
    candidateDisplayName: 'Candidate',
    introAcceptedAt: new Date().toISOString(),
    interview: {
      id: 'interview-1',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      duration: 30,
      platform: 'google_meet',
      meetingUrl: 'https://meet.google.com/example',
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

  it('gives the empty state one clear next action', async () => {
    getInterviewCorridorItemsMock.mockResolvedValue({ items: [] });

    render(<InterviewsPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /no active interview workflow yet/i })
      ).toBeInTheDocument();
    });

    const nextAction = screen.getByRole('link', { name: /review matching/i });
    expect(nextAction).toHaveAttribute('href', '/app/i/matching');
  });

  it('keeps load failures separate from the empty workflow state and retries', async () => {
    getInterviewCorridorItemsMock
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({ items: [] });

    render(<InterviewsPage />);

    expect(
      await screen.findByRole('heading', { name: /interview workflow could not load/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /your scheduled interviews and decisions are still safe\. retry this section to refresh the interview workflow\./i
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
  });

  it('shows filled interview details and engagement confirmation controls', async () => {
    getInterviewCorridorItemsMock.mockResolvedValue({
      items: [
        buildInterviewItem(),
        buildInterviewItem({
          id: 'match-2',
          assignmentTitle: 'Proof operations lead',
          organizationName: 'Northstar Evidence Studio',
          interview: {
            id: 'interview-2',
            scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            duration: 45,
            platform: 'manual',
            meetingUrl: 'pending',
            manualMeetingProvider: 'teams',
            rescheduleCount: 1,
            status: 'completed',
            completedAt: new Date().toISOString(),
            cancelledAt: null,
            noShowAt: null,
          },
          decisionState: 'hire',
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
          corridor: buildCorridor({
            nextAction: {
              id: 'confirm_engagement',
              label: 'Confirm engagement',
              description: 'Confirm the engagement type.',
            },
          }),
        }),
      ],
    });

    render(<InterviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('Nordic Future Labs')).toBeInTheDocument();
      expect(screen.getByText('Northstar Evidence Studio')).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /join meeting/i })).toHaveAttribute(
      'href',
      'https://meet.google.com/example'
    );
    expect(screen.getByText('Google Meet')).toBeInTheDocument();
    expect(screen.queryByText('Google_meet')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /add to calendar/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/engagement type/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm engagement/i })).toBeInTheDocument();
  });

  it('keeps failed engagement confirmations visible and retryable', async () => {
    const initialInterview = buildInterviewItem({
      id: 'match-2',
      assignmentTitle: 'Proof operations lead',
      organizationName: 'Northstar Evidence Studio',
      interview: {
        id: 'interview-2',
        scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        duration: 45,
        platform: 'manual',
        meetingUrl: 'pending',
        manualMeetingProvider: 'teams',
        rescheduleCount: 1,
        status: 'completed',
        completedAt: new Date().toISOString(),
        cancelledAt: null,
        noShowAt: null,
      },
      decisionState: 'hire',
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
      corridor: buildCorridor({
        nextAction: {
          id: 'confirm_engagement',
          label: 'Confirm engagement',
          description: 'Confirm the engagement type.',
        },
      }),
    });
    const confirmedInterview = {
      ...initialInterview,
      engagementVerification: {
        ...initialInterview.engagementVerification,
        status: 'pending_organization_confirmation',
        statusLabel: 'Awaiting organization confirmation',
        engagementType: 'full_time',
        candidateConfirmedAt: new Date().toISOString(),
      },
      corridor: buildCorridor({
        nextAction: {
          id: 'wait_for_engagement_confirmation',
          label: 'Wait',
          description: 'Waiting for the organization to confirm.',
        },
      }),
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

    render(<InterviewsPage />);

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
    expect(alert).toHaveTextContent('Engagement confirmation is temporarily unavailable.');
    expect(screen.getByLabelText('Engagement type')).toHaveValue('full_time');

    fireEvent.click(within(alert).getByRole('button', { name: 'Retry confirmation' }));

    await waitFor(() => {
      expect(
        screen.getByText('Engagement: Awaiting organization confirmation')
      ).toBeInTheDocument();
    });

    expect(
      fetchCalls.filter((call) => call.url === '/api/engagement-verifications/engagement-1')
    ).toHaveLength(2);
  });
});
