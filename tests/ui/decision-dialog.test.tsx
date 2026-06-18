import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DecisionDialog } from '@/components/decisions/DecisionDialog';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientDiagnostic } from '@/lib/client-diagnostics';
import { useToast } from '@/hooks/use-toast';

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children, ...props }: any) => (
    <div role="dialog" aria-label="Record Workflow Decision" {...props}>
      {children}
    </div>
  ),
  DialogDescription: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  DialogFooter: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientDiagnostic: vi.fn(),
}));

const toastMock = vi.fn();
const apiFetchMock = vi.mocked(apiFetch);
const dispatchClientDiagnosticMock = vi.mocked(dispatchClientDiagnostic);
const useToastMock = vi.mocked(useToast);

function renderDecisionDialog(
  overrides: Partial<React.ComponentProps<typeof DecisionDialog>> = {}
) {
  return render(
    <DecisionDialog
      isOpen={true}
      onClose={vi.fn()}
      interviewId="interview-1"
      candidateName="Mika Andersson"
      assignmentTitle="Evidence Operations Lead"
      {...overrides}
    />
  );
}

function mockDecisionWindowFetch(responses: Response[]) {
  const fetchMock = vi.fn(async () => {
    const response = responses.shift();
    if (!response) {
      return new Response(JSON.stringify({ error: 'Unexpected request' }), { status: 500 });
    }
    return response;
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('DecisionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toastMock.mockReset();
    useToastMock.mockReturnValue({ toast: toastMock } as any);
    apiFetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          decision: {
            id: 'decision-1',
            withinSLA: false,
          },
        }),
        { status: 200 }
      )
    );
  });

  it('labels the decision option group and preserves selected-option state', async () => {
    mockDecisionWindowFetch([
      new Response(
        JSON.stringify({
          hoursRemaining: 18.5,
          isOverdue: false,
          deadline: '2026-03-13T12:00:00.000Z',
        }),
        { status: 200 }
      ),
    ]);

    renderDecisionDialog();

    expect(await screen.findByText('18h 30m remaining')).toBeInTheDocument();

    const decisionGroup = screen.getByRole('group', { name: 'Select Decision' });
    const advanceOption = within(decisionGroup).getByRole('button', { name: 'Advance' });
    const hireOption = within(decisionGroup).getByRole('button', { name: 'Hire' });

    expect(advanceOption).toHaveAttribute('aria-pressed', 'false');
    expect(hireOption).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(advanceOption);

    expect(advanceOption).toHaveAttribute('aria-pressed', 'true');
    expect(hireOption).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows an inline retry state when the decision deadline cannot load', async () => {
    const fetchMock = mockDecisionWindowFetch([
      new Response(JSON.stringify({ error: 'temporary outage' }), { status: 500 }),
      new Response(
        JSON.stringify({
          hoursRemaining: 18.5,
          isOverdue: false,
          deadline: '2026-03-13T12:00:00.000Z',
        }),
        { status: 200 }
      ),
    ]);

    renderDecisionDialog();

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('Decision deadline unavailable');
    expect(alert).toHaveTextContent('The decision can still be recorded');
    expect(alert).toHaveTextContent('48-hour SLA countdown could not load');
    expect(toastMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Failed to load decision window' })
    );
    expect(dispatchClientDiagnosticMock).toHaveBeenCalledWith('decision.window.fetch_failed', {
      errorName: 'Error',
      hasError: true,
    });
    expect(JSON.stringify(dispatchClientDiagnosticMock.mock.calls)).not.toContain(
      'temporary outage'
    );

    fireEvent.click(within(alert).getByRole('button', { name: 'Retry deadline' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('18h 30m remaining')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('still lets the organization record a decision after a deadline lookup failure', async () => {
    mockDecisionWindowFetch([
      new Response(JSON.stringify({ error: 'temporary outage' }), { status: 500 }),
    ]);
    const onDecisionMade = vi.fn();
    const onClose = vi.fn();

    renderDecisionDialog({ onDecisionMade, onClose });

    expect(await screen.findByRole('alert')).toHaveTextContent('Decision deadline unavailable');

    fireEvent.click(screen.getByRole('button', { name: 'Advance' }));
    fireEvent.change(screen.getByLabelText(/Feedback/i), {
      target: { value: 'Move this candidate to the final review step.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Workflow Decision' }));

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/api/decisions',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          interviewId: 'interview-1',
          decision: 'advance',
          feedback: 'Move this candidate to the final review step.',
        }),
      })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onDecisionMade).toHaveBeenCalledTimes(1);
  });

  it('keeps failed decision submissions visible and retryable without raw service text', async () => {
    mockDecisionWindowFetch([
      new Response(
        JSON.stringify({
          hoursRemaining: 18.5,
          isOverdue: false,
          deadline: '2026-03-13T12:00:00.000Z',
        }),
        { status: 200 }
      ),
    ]);
    apiFetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Decision transition blocked by policy guard' }), {
        status: 500,
      })
    );
    const onDecisionMade = vi.fn();
    const onClose = vi.fn();

    renderDecisionDialog({ onDecisionMade, onClose });

    expect(await screen.findByText('18h 30m remaining')).toBeInTheDocument();

    const feedback = 'Hold until the hiring team reviews the last proof artifact.';
    fireEvent.click(screen.getByRole('button', { name: 'Hold' }));
    fireEvent.change(screen.getByLabelText(/Feedback/i), {
      target: { value: feedback },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Workflow Decision' }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Decision not recorded',
          description:
            'Decision could not be recorded. Your selected outcome and notes are still here; please try again.',
          variant: 'destructive',
        })
      );
    });
    expect(
      toastMock.mock.calls.some((call) =>
        JSON.stringify(call[0]).includes('Decision transition blocked by policy guard')
      )
    ).toBe(false);
    expect(dispatchClientDiagnosticMock).toHaveBeenCalledWith(
      'decision.submit_returned_error',
      expect.objectContaining({
        decision: 'hold',
        status: 500,
        hasReturnedError: true,
      })
    );
    expect(dispatchClientDiagnosticMock).toHaveBeenCalledWith(
      'decision.submit_failed',
      expect.objectContaining({
        decision: 'hold',
        errorName: 'Error',
        hasError: true,
      })
    );
    expect(
      JSON.stringify(dispatchClientDiagnosticMock.mock.calls).includes(
        'Decision transition blocked by policy guard'
      )
    ).toBe(false);
    expect(screen.getByRole('button', { name: 'Hold' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText(/Feedback/i)).toHaveValue(feedback);
    expect(onClose).not.toHaveBeenCalled();
    expect(onDecisionMade).not.toHaveBeenCalled();
  });
});
