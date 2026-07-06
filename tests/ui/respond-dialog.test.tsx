import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RespondDialog } from '@/app/app/i/verifications/components/RespondDialog';

const { apiFetchMock, diagnosticMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
  diagnosticMock: vi.fn(),
}));

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientDiagnostic: (...args: unknown[]) => diagnosticMock(...args),
  dispatchClientErrorDiagnostic: (...args: unknown[]) => diagnosticMock(...args),
}));

function jsonResponse(payload: unknown, ok = false, status = ok ? 200 : 500) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(payload),
  };
}

function renderRespondDialog(overrides = {}) {
  const request = {
    id: 'request-1',
    requestKind: 'generic_verification',
    proofLabel: 'TypeScript migration proof',
    claimSummary: 'Confirm this TypeScript claim from direct observation.',
    confirmationOutcome: 'A scoped attestation is added to this proof.',
    message: 'Can you confirm this one claim?',
    skills: {
      competency_level: 3,
    },
    ...overrides,
  };

  return render(
    <RespondDialog
      open
      onOpenChange={vi.fn()}
      request={request}
      action="accept"
      onComplete={vi.fn()}
      getSkillName={() => 'TypeScript'}
      getBreadcrumb={() => 'Proof Pack > TypeScript migration proof'}
      getRequesterName={() => 'Jordan Proof'}
      getCompetencyLabel={() => 'Advanced'}
    />
  );
}

describe('RespondDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps failed verification responses visible and retryable', async () => {
    const submitError = new Error('verification service unavailable');
    apiFetchMock.mockRejectedValueOnce(submitError);

    renderRespondDialog();

    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/Add a message/i), {
      target: { value: 'I directly reviewed the migration work.' },
    });

    fireEvent.click(within(dialog).getByRole('button', { name: /Confirm observation/i }));

    const alert = await within(dialog).findByRole('alert');
    expect(alert).toHaveTextContent(
      'Verification response could not be sent. Your response is still here; please try again.'
    );
    expect(alert).not.toHaveTextContent('Failed to respond to verification request');
    expect(
      within(dialog).getByDisplayValue('I directly reviewed the migration work.')
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(within(dialog).getByRole('button', { name: /Confirm observation/i })).toBeEnabled();
    });
    expect(diagnosticMock).toHaveBeenCalledWith('verifications.respond.submit_failed', submitError);
  });

  it('preserves known completed-response failures without dropping the draft', async () => {
    apiFetchMock.mockResolvedValueOnce(
      jsonResponse({ error: 'This verification request has already been accepted' })
    );

    renderRespondDialog();

    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/Add a message/i), {
      target: { value: 'I already reviewed this claim.' },
    });

    fireEvent.click(within(dialog).getByRole('button', { name: /Confirm observation/i }));

    const alert = await within(dialog).findByRole('alert');
    expect(alert).toHaveTextContent('This verification request has already been accepted');
    expect(within(dialog).getByDisplayValue('I already reviewed this claim.')).toBeInTheDocument();
    expect(diagnosticMock).not.toHaveBeenCalledWith(
      'verifications.respond.returned_error',
      expect.any(Error)
    );
  });

  it('maps validation failures to reviewable attestation copy', async () => {
    apiFetchMock.mockResolvedValueOnce(jsonResponse({ error: 'Validation failed' }));

    renderRespondDialog();

    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /Confirm observation/i }));

    const alert = await within(dialog).findByRole('alert');
    expect(alert).toHaveTextContent('Review the required attestation details before submitting.');
  });

  it('keeps unexpected returned response failures safe and diagnostic', async () => {
    const rawError = 'Postgres update failed: policy stack detail';
    apiFetchMock.mockResolvedValueOnce(jsonResponse({ error: rawError }, false, 503));

    renderRespondDialog();

    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/Add a message/i), {
      target: { value: 'I directly reviewed this claim.' },
    });

    fireEvent.click(within(dialog).getByRole('button', { name: /Confirm observation/i }));

    const alert = await within(dialog).findByRole('alert');
    expect(alert).toHaveTextContent(
      'Verification response could not be sent. Your response is still here; please try again.'
    );
    expect(alert).not.toHaveTextContent(rawError);
    expect(within(dialog).getByDisplayValue('I directly reviewed this claim.')).toBeInTheDocument();
    expect(diagnosticMock).toHaveBeenCalledWith('verifications.respond.returned_error', {
      status: 503,
      hasReturnedError: true,
    });
    expect(JSON.stringify(diagnosticMock.mock.calls)).not.toContain(rawError);
  });
});
