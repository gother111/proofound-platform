import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import InterviewFeedbackPage from '@/app/app/interviews/[id]/feedback/page';
import { VISUAL_FEEDBACK_INTERVIEW_IDS } from '@/lib/feedback/visual-fixtures';

vi.mock('@/components/feedback/FeedbackForm', () => ({
  default: ({ alreadySubmitted, template }: any) => (
    <section data-testid={`feedback-form-${template.direction}`}>
      {template.name} {alreadySubmitted ? 'submitted' : 'open'}
    </section>
  ),
}));

describe('InterviewFeedbackPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('gives empty shared feedback a concrete next action', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        interview: {
          id: 'interview-1',
          status: 'completed',
        },
        templates: [
          {
            id: 'candidate-template',
            name: 'Participant feedback',
            direction: 'candidate_to_org',
            questions: [],
          },
          {
            id: 'org-template',
            name: 'Organization workflow feedback',
            direction: 'org_to_candidate',
            questions: [],
          },
        ],
        responses: [],
      }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    render(
      await InterviewFeedbackPage({
        params: Promise.resolve({ id: 'interview-1' }),
      })
    );

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/feedback/interview-1'), {
      cache: 'no-store',
    });
    expect(screen.getByTestId('feedback-form-candidate_to_org')).toHaveTextContent(
      'Participant feedback open'
    );
    expect(screen.getByTestId('feedback-form-org_to_candidate')).toHaveTextContent(
      'Organization workflow feedback open'
    );
    expect(
      screen.getByText(
        'Share structured, anonymous feedback and view anonymized responses once they are submitted.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Feedback is waiting on submissions')).toBeInTheDocument();
    expect(screen.getByText(/Submit the relevant feedback form above/i)).toBeInTheDocument();
    expect(screen.queryByText(/other side/i)).not.toBeInTheDocument();
    expect(screen.queryByText('No feedback shared yet.')).not.toBeInTheDocument();
  });

  it('shows a privacy-safe unavailable state when feedback cannot load', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      json: async () => ({ error: 'temporary feedback outage' }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    render(
      await InterviewFeedbackPage({
        params: Promise.resolve({ id: 'interview-1' }),
      })
    );

    expect(
      screen.getByRole('heading', { name: /interview feedback could not load/i })
    ).toBeInTheDocument();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Feedback record unavailable');
    expect(screen.getByText(/No feedback was submitted from this page/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /retry feedback/i })).toHaveAttribute(
      'href',
      '/app/interviews/interview-1/feedback'
    );
    expect(screen.queryByTestId('feedback-form-candidate_to_org')).not.toBeInTheDocument();
    expect(screen.queryByText(/temporary feedback outage/i)).not.toBeInTheDocument();
  });

  it('renders the visual feedback fixture without external fetch state', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_SUPABASE', 'true');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'true');
    vi.stubEnv('VERCEL_ENV', 'development');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(
      await InterviewFeedbackPage({
        params: Promise.resolve({ id: VISUAL_FEEDBACK_INTERVIEW_IDS.completed }),
      })
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        'Share structured, anonymous feedback and view anonymized responses once they are submitted.'
      )
    ).toBeInTheDocument();
    expect(screen.getByTestId('feedback-form-candidate_to_org')).toHaveTextContent(
      'Participant feedback open'
    );
    expect(screen.getByTestId('feedback-form-org_to_candidate')).toHaveTextContent(
      'Organization workflow feedback open'
    );
    expect(
      screen.getByText(/proof packet made the discussion easier to anchor/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/other side/i)).not.toBeInTheDocument();
  });
});
