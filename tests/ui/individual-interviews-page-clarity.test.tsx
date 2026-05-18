import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import InterviewsPage from '@/app/app/i/interviews/page';

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
    getInterviewCorridorItemsMock.mockReset();
  });

  it('gives the empty state one clear next action', async () => {
    getInterviewCorridorItemsMock.mockResolvedValue({ items: [] });

    render(<InterviewsPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /no active hiring corridor yet/i })
      ).toBeInTheDocument();
    });

    const nextAction = screen.getByRole('link', { name: /review matching/i });
    expect(nextAction).toHaveAttribute('href', '/app/i/matching');
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
    expect(screen.getByRole('link', { name: /add to google calendar/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/engagement type/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm engagement/i })).toBeInTheDocument();
  });
});
