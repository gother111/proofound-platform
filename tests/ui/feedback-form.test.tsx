import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import FeedbackForm from '../../src/components/feedback/FeedbackForm';
import { VISUAL_FEEDBACK_TOKENS } from '../../src/lib/feedback/visual-fixtures';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

// Simplify UI primitives to avoid unrelated rendering errors
vi.mock('../../src/components/ui/card', () => ({
  Card: (props: any) => <div {...props} />,
  CardHeader: (props: any) => <div {...props} />,
  CardContent: (props: any) => <div {...props} />,
  CardTitle: (props: any) => <div {...props} />,
}));

vi.mock('../../src/components/ui/button', () => ({
  Button: (props: any) => <button {...props} />,
}));

vi.mock('../../src/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock('../../src/components/ui/label', () => ({
  Label: ({ children, htmlFor, ...rest }: any) => (
    <label htmlFor={htmlFor ?? rest.id ?? 'mock-id'} {...rest}>
      {children}
    </label>
  ),
}));

vi.mock('../../src/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

const template = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Candidate → Org Default',
  direction: 'candidate_to_org' as const,
  questions: [
    {
      id: 'q-scale',
      prompt: 'Clarity of role expectations',
      question_type: 'scale' as const,
      scale_min: 1,
      scale_max: 5,
      required: true,
      sort_order: 1,
    },
    {
      id: 'q-text',
      prompt: 'What went well?',
      question_type: 'text' as const,
      required: false,
      sort_order: 2,
    },
  ],
};

describe('FeedbackForm', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('shows validation when required fields are missing', async () => {
    render(<FeedbackForm template={template} interviewId="interview-1" />);

    fireEvent.click(screen.getByRole('button', { name: /submit feedback/i }));

    expect(await screen.findByText(/Please complete the required questions/i)).toBeInTheDocument();
  });

  it('keeps organization feedback prompts workflow-scoped instead of candidate-led', () => {
    render(
      <FeedbackForm
        template={{
          ...template,
          id: '22222222-2222-4222-8222-222222222222',
          name: 'Org → Other Side Default',
          direction: 'org_to_candidate',
        }}
        interviewId="interview-1"
      />
    );

    expect(screen.getByText('Share workflow feedback')).toBeInTheDocument();
    expect(screen.queryByText('Share feedback with the candidate')).not.toBeInTheDocument();
  });

  it('submits when required fields are provided', async () => {
    render(<FeedbackForm template={template} interviewId="interview-1" token="token-1" />);

    const scaleInput = screen.getByRole('spinbutton');
    fireEvent.change(scaleInput, { target: { value: '5' } });
    const textarea = screen.getByPlaceholderText(/Add details/);
    fireEvent.change(textarea, { target: { value: 'Great pacing' } });

    fireEvent.click(screen.getByRole('button', { name: /submit feedback/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const payload = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(payload.token).toBe('token-1');
    expect(payload.answers[0].score).toBe(5);
    expect(await screen.findByText(/Feedback submitted/)).toBeInTheDocument();
  });

  it('records visual fixture feedback locally without calling the guarded submit API', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_SUPABASE', 'true');
    vi.stubEnv('NEXT_PUBLIC_PROOFOUND_VISUAL_FIXTURES', 'true');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'true');
    vi.stubEnv('VERCEL_ENV', 'development');

    render(
      <FeedbackForm
        template={template}
        interviewId="visual-feedback-interview-1"
        token={VISUAL_FEEDBACK_TOKENS.pendingCandidateToOrg}
        surface="embedded"
      />
    );

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: /submit feedback/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(/Feedback submitted/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('keeps visual fixture tokens on the guarded submit API path in plain mock mode', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_SUPABASE', 'true');
    vi.stubEnv('NEXT_PUBLIC_PROOFOUND_VISUAL_FIXTURES', 'false');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'false');
    vi.stubEnv('VERCEL_ENV', 'development');

    render(
      <FeedbackForm
        template={template}
        interviewId="visual-feedback-interview-1"
        token={VISUAL_FEEDBACK_TOKENS.pendingCandidateToOrg}
        surface="embedded"
      />
    );

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: /submit feedback/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/feedback/submit',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const payload = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(payload.token).toBe(VISUAL_FEEDBACK_TOKENS.pendingCandidateToOrg);
    expect(await screen.findByRole('status')).toHaveTextContent(/Feedback submitted/i);
  });
});
