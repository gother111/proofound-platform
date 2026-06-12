import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import FeedbackTokenPage from '@/app/(public)/feedback/[token]/page';

vi.mock('@/components/feedback/FeedbackForm', () => ({
  default: ({ template, token }: any) => (
    <section data-testid="feedback-token-form">
      {template.name} for {token}
    </section>
  ),
}));

async function renderFeedbackTokenPage(token = 'feedback-token-1') {
  return render(
    await FeedbackTokenPage({
      params: Promise.resolve({ token }),
    })
  );
}

function mockTokenResponse(body: unknown, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok,
      json: async () => body,
    }))
  );
}

describe('FeedbackTokenPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('gives unavailable feedback links a safe next action', async () => {
    mockTokenResponse({ error: 'not found' }, false);

    await renderFeedbackTokenPage('missing-token');

    expect(
      screen.getByRole('heading', { name: /Unable to load feedback request/i })
    ).toBeInTheDocument();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Feedback link unavailable');
    expect(alert).toHaveTextContent('Nothing was submitted from this page');
    expect(alert).toHaveTextContent('Ask the sender for a fresh feedback request');
    expect(alert).toHaveTextContent('You do not need a Proofound account');
    expect(screen.getByRole('link', { name: 'Return home' })).toHaveAttribute('href', '/');
  });

  it('explains expired feedback links without showing the form', async () => {
    mockTokenResponse({
      token: 'expired-token',
      direction: 'candidate_to_org',
      expiresAt: '2000-01-01T00:00:00.000Z',
      usedAt: null,
      template: {
        id: 'template-1',
        name: 'Candidate feedback',
        direction: 'candidate_to_org',
      },
      questions: [],
      interview: { id: 'interview-1' },
    });

    await renderFeedbackTokenPage('expired-token');

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Feedback link expired');
    expect(alert).toHaveTextContent('Nothing was submitted from this page');
    expect(alert).toHaveTextContent('Ask the sender to issue a new feedback request');
    expect(screen.queryByTestId('feedback-token-form')).not.toBeInTheDocument();
  });

  it('confirms already submitted feedback as a completed state', async () => {
    mockTokenResponse({
      token: 'used-token',
      direction: 'candidate_to_org',
      expiresAt: '2999-01-01T00:00:00.000Z',
      usedAt: '2026-06-12T08:00:00.000Z',
      template: {
        id: 'template-1',
        name: 'Candidate feedback',
        direction: 'candidate_to_org',
      },
      questions: [],
      interview: { id: 'interview-1' },
    });

    await renderFeedbackTokenPage('used-token');

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Feedback already submitted');
    expect(status).toHaveTextContent('You can close this page');
    expect(screen.getByRole('link', { name: 'Return to Proofound' })).toHaveAttribute('href', '/');
    expect(screen.queryByTestId('feedback-token-form')).not.toBeInTheDocument();
  });

  it('gives missing feedback templates a concrete recovery path', async () => {
    mockTokenResponse({
      token: 'template-missing-token',
      direction: 'candidate_to_org',
      expiresAt: '2999-01-01T00:00:00.000Z',
      usedAt: null,
      template: null,
      questions: [],
      interview: { id: 'interview-1' },
    });

    await renderFeedbackTokenPage('template-missing-token');

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Feedback form unavailable');
    expect(alert).toHaveTextContent('question set is missing');
    expect(alert).toHaveTextContent('Ask the sender to resend the feedback request');
    expect(alert).toHaveTextContent('Your name remains hidden');
    expect(screen.queryByText('Could not load the feedback form.')).not.toBeInTheDocument();
  });

  it('renders a valid feedback token form with anonymous-context copy', async () => {
    mockTokenResponse({
      token: 'valid-token',
      direction: 'candidate_to_org',
      expiresAt: '2999-01-01T00:00:00.000Z',
      usedAt: null,
      template: {
        id: 'template-1',
        name: 'Candidate feedback',
        direction: 'candidate_to_org',
      },
      questions: [{ id: 'q1', prompt: 'How clear was the process?' }],
      interview: { id: 'interview-1' },
    });

    await renderFeedbackTokenPage('valid-token');

    expect(screen.getByText('Interview feedback')).toBeInTheDocument();
    expect(
      screen.getByText('Share quick feedback. Your name will be hidden from the other side.')
    ).toBeInTheDocument();
    expect(screen.getByTestId('feedback-token-form')).toHaveTextContent(
      'Candidate feedback for valid-token'
    );
  });
});
