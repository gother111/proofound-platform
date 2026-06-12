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
  dispatchClientErrorDiagnostic: (...args: unknown[]) => diagnosticMock(...args),
}));

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

    fireEvent.click(within(dialog).getByRole('button', { name: /Confirm attestation/i }));

    const alert = await within(dialog).findByRole('alert');
    expect(alert).toHaveTextContent(
      'Verification response could not be sent. Your response is still here; please try again.'
    );
    expect(alert).not.toHaveTextContent('Failed to respond to verification request');
    expect(
      within(dialog).getByDisplayValue('I directly reviewed the migration work.')
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(within(dialog).getByRole('button', { name: /Confirm attestation/i })).toBeEnabled();
    });
    expect(diagnosticMock).toHaveBeenCalledWith('verifications.respond.submit_failed', submitError);
  });
});
