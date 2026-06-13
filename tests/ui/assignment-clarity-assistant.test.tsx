import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AssignmentClarityAssistant } from '@/components/assignments/AssignmentClarityAssistant';
import { dispatchClientDiagnostic, dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { toast } from 'sonner';

const apiFetchMock = vi.fn();

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientDiagnostic: vi.fn(),
  dispatchClientErrorDiagnostic: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

const dispatchClientDiagnosticMock = vi.mocked(dispatchClientDiagnostic);
const dispatchClientErrorDiagnosticMock = vi.mocked(dispatchClientErrorDiagnostic);
const toastErrorMock = vi.mocked(toast.error);

function mockResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

function Harness({ onEnsureDraft = vi.fn() }: { onEnsureDraft?: () => Promise<any> }) {
  const form = useForm({
    defaultValues: {
      role: 'Ops lead',
      businessValue: 'Make an impact.',
      description: 'Wear many hats.',
      outcomes: [{ metric: 'Launch pilot', target: 'First customer live', timeframe: '90d' }],
      expectedImpact: '',
      engagementType: 'contract_consulting',
      locationMode: 'remote',
      city: '',
      country: '',
      compMin: 100000,
      compMax: 120000,
      currency: 'USD',
      hoursMin: 20,
      hoursMax: 40,
      mustHaveSkills: [],
      verificationGates: [],
    },
  });

  return (
    <div>
      <AssignmentClarityAssistant
        form={form}
        assignmentId="11111111-1111-4111-8111-111111111111"
        orgId="22222222-2222-4222-8222-222222222222"
        orgSlug="proofound-org"
        onEnsureDraft={onEnsureDraft}
      />
      <output data-testid="role-value">{form.watch('role')}</output>
      <output data-testid="description-value">{form.watch('description')}</output>
    </div>
  );
}

describe('Assignment Clarity Assistant UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input) === '/api/feature-flags') {
        return {
          ok: true,
          json: async () => ({ flags: { assistiveAiUi: true } }),
        } as Response;
      }
      throw new Error(`Unexpected fetch call: ${String(input)}`);
    }) as any;
    apiFetchMock.mockResolvedValue(
      mockResponse({
        suggestionId: '33333333-3333-4333-8333-333333333333',
        ambiguityFlags: ['Outcome summary is vague or missing concrete deliverables.'],
        suggestedRewrite: {
          title: 'Pilot operations lead',
          outcomeSummary: 'Own the first customer pilot launch and publish weekly risk updates.',
          proofExpectations:
            'Proof should show shipped operating work, ownership, and clear tradeoff decisions.',
          constraints: { locationMode: 'remote', hoursMin: 20, hoursMax: 40 },
        },
        reviewQuestions: ['Which proof artifact would show ownership?'],
        excludedOrRiskyCriteria: ['Removed scoring language.'],
      })
    );
  });

  it('shows the button and supports explicit accept and dismiss behavior', async () => {
    render(<Harness />);

    fireEvent.click(await screen.findByRole('button', { name: /clarify assignment/i }));

    await screen.findByText('Draft assistance');
    await screen.findByText('Ambiguity flags');
    expect(screen.getByLabelText('Title')).toHaveValue('Pilot operations lead');
    expect(screen.getByTestId('role-value')).toHaveTextContent('Ops lead');

    fireEvent.click(screen.getByRole('button', { name: /accept title/i }));
    await waitFor(() =>
      expect(screen.getByTestId('role-value')).toHaveTextContent('Pilot operations lead')
    );

    fireEvent.click(screen.getByRole('button', { name: /dismiss outcome summary/i }));
    expect(screen.queryByLabelText('Outcome summary')).not.toBeInTheDocument();
    expect(screen.getByTestId('description-value')).toHaveTextContent('Wear many hats.');

    expect(apiFetchMock).toHaveBeenCalledWith(
      '/api/ai/assignments/clarify',
      expect.objectContaining({ method: 'POST' })
    );
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/api/ai/suggestions/events',
      expect.objectContaining({
        method: 'POST',
        body: expect.not.stringContaining('Pilot operations lead'),
      })
    );
    expect(JSON.stringify(apiFetchMock.mock.calls)).not.toContain('publish');
  });

  it('shows manual guidance without the AI button when the feature flag is disabled', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ flags: { assistiveAiUi: false } }),
    });

    render(<Harness />);

    expect(await screen.findByText(/Manual guidance: name the outcome/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /clarify assignment/i })).not.toBeInTheDocument();
  });

  it('shows a deterministic manual checklist when provider assistance fails', async () => {
    apiFetchMock.mockResolvedValueOnce(
      mockResponse({
        fallback: true,
        ambiguityFlags: ['AI suggestions are temporarily unavailable; manual editing still works.'],
        suggestedRewrite: {
          title: 'Ops lead',
        },
        reviewQuestions: ['Which proof artifact would show ownership?'],
        excludedOrRiskyCriteria: [],
      })
    );

    render(<Harness />);

    fireEvent.click(await screen.findByRole('button', { name: /clarify assignment/i }));

    await screen.findByText('Manual clarity checklist');
    expect(
      screen.getByText('AI suggestions are temporarily unavailable; manual editing still works.')
    ).toBeInTheDocument();
  });

  it('uses the manual checklist when the assistant endpoint is safely disabled', async () => {
    apiFetchMock.mockResolvedValueOnce(
      mockResponse(
        {
          error: 'AI assist is disabled',
          code: 'ai_feature_kill_switch',
          fallbackAvailable: true,
        },
        503
      )
    );

    render(<Harness />);

    fireEvent.click(await screen.findByRole('button', { name: /clarify assignment/i }));

    await screen.findByText('Manual clarity checklist');
    expect(
      screen.getByText('AI suggestions are temporarily unavailable; manual editing still works.')
    ).toBeInTheDocument();
    expect(screen.queryByText(/AI assist is disabled/i)).not.toBeInTheDocument();
  });

  it('keeps returned assistant failures safe while preserving the manual checklist', async () => {
    const rawFailure = 'Provider timeout for org proofound-org using request req_secret_123.';
    apiFetchMock.mockResolvedValueOnce(
      mockResponse(
        {
          error: rawFailure,
          message: 'Trace abc123 was captured.',
        },
        502
      )
    );

    render(<Harness />);

    fireEvent.click(await screen.findByRole('button', { name: /clarify assignment/i }));

    await screen.findByText('Manual clarity checklist');
    expect(
      screen.getByText('Guided suggestions could not load; manual editing still works.')
    ).toBeInTheDocument();
    expect(screen.queryByText(/req_secret_123/i)).not.toBeInTheDocument();
    expect(dispatchClientDiagnosticMock).toHaveBeenCalledWith(
      'assignments.clarity_assistant.returned_error',
      {
        status: 502,
        hasReturnedError: true,
      }
    );
    expect(dispatchClientErrorDiagnosticMock).not.toHaveBeenCalled();
    expect(JSON.stringify(dispatchClientDiagnosticMock.mock.calls)).not.toContain(rawFailure);
    expect(JSON.stringify(toastErrorMock.mock.calls)).not.toContain(rawFailure);
    expect(toastErrorMock).toHaveBeenCalledWith(
      'Guided suggestions could not load. Manual checklist is ready.'
    );
  });

  it('keeps unexpected assistant failures on the manual checklist path', async () => {
    const rawFailure = new Error('provider timeout with token abc123');
    apiFetchMock.mockRejectedValueOnce(rawFailure);

    render(<Harness />);

    fireEvent.click(await screen.findByRole('button', { name: /clarify assignment/i }));

    await screen.findByText('Manual clarity checklist');
    expect(
      screen.getByText('Guided suggestions could not load; manual editing still works.')
    ).toBeInTheDocument();
    expect(screen.queryByText(/provider timeout/i)).not.toBeInTheDocument();
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'assignments.clarity_assistant.request_failed',
      rawFailure
    );
    expect(toastErrorMock).toHaveBeenCalledWith(
      'Guided suggestions could not load. Manual checklist is ready.'
    );
  });
});
