import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import InterviewFeedbackPage from '@/app/app/interviews/[id]/feedback/page';

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
    expect(screen.getByText('Feedback is waiting on submissions')).toBeInTheDocument();
    expect(screen.getByText(/Submit the relevant feedback form above/i)).toBeInTheDocument();
    expect(screen.queryByText('No feedback shared yet.')).not.toBeInTheDocument();
  });
});
