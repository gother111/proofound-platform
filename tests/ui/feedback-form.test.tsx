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

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Please fix the highlighted questions before submitting/i
    );
    expect(screen.getByRole('spinbutton')).toHaveAttribute('aria-invalid', 'true');
    expect(
      screen.getByText('Choose a rating to complete this required question.')
    ).toBeInTheDocument();
    expect(screen.getByText(/Required questions are labeled Required/i)).toBeInTheDocument();
  });

  it('labels required and optional questions without implying required text is optional', async () => {
    render(
      <FeedbackForm
        template={{
          ...template,
          questions: [
            {
              id: 'q-text-required',
              prompt: 'What should improve next?',
              question_type: 'text' as const,
              required: true,
              sort_order: 1,
            },
            {
              id: 'q-text-optional',
              prompt: 'Anything else?',
              question_type: 'text' as const,
              required: false,
              sort_order: 2,
            },
          ],
        }}
        interviewId="interview-1"
      />
    );

    expect(screen.getAllByText('Required')).toHaveLength(1);
    expect(screen.getAllByText('Optional')).toHaveLength(1);
    expect(screen.getByLabelText(/What should improve next/i)).toHaveAttribute(
      'placeholder',
      'Add the required context'
    );
    expect(screen.getByLabelText(/Anything else/i)).toHaveAttribute(
      'placeholder',
      'Add details (optional)'
    );

    fireEvent.click(screen.getByRole('button', { name: /submit feedback/i }));

    expect(
      await screen.findByText('Add a short answer to complete this required question.')
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/What should improve next/i)).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  it('blocks out-of-range scale ratings before calling the feedback API', async () => {
    render(<FeedbackForm template={template} interviewId="interview-1" token="token-1" />);

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: /submit feedback/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Please fix the highlighted questions before submitting/i
    );
    expect(screen.getByText('Choose a rating between 1 and 5.')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toHaveAttribute('aria-invalid', 'true');
    expect(global.fetch).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5' } });
    expect(screen.queryByText('Choose a rating between 1 and 5.')).not.toBeInTheDocument();
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
    expect(screen.queryByRole('button', { name: /submit feedback/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });

  it('keeps answers retryable when feedback submission fails', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('feedback service unavailable'));

    render(<FeedbackForm template={template} interviewId="interview-1" token="token-1" />);

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '4' } });
    fireEvent.change(screen.getByPlaceholderText(/Add details/), {
      target: { value: 'The role expectations were clear.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit feedback/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Feedback could not be submitted. Your answers are still here; please try again.'
    );
    expect(screen.getByRole('spinbutton')).toHaveValue(4);
    expect(screen.getByDisplayValue('The role expectations were clear.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit feedback/i })).toBeEnabled();
  });

  it('uses retry copy when the feedback API returns an unreadable generic failure', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error('invalid json');
      },
    } as any);

    render(<FeedbackForm template={template} interviewId="interview-1" token="token-1" />);

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: /submit feedback/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Feedback could not be submitted. Your answers are still here; please try again.'
    );
    expect(screen.getByRole('spinbutton')).toHaveValue(3);
    expect(screen.getByRole('button', { name: /submit feedback/i })).toBeEnabled();
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
    expect(screen.queryByRole('button', { name: /submit feedback/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
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
