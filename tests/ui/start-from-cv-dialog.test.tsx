import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiFetchMock = vi.hoisted(() => vi.fn());
const dispatchClientErrorDiagnosticMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: (...args: unknown[]) => dispatchClientErrorDiagnosticMock(...args),
}));

import { StartFromCvDialog } from '@/components/profile/StartFromCvDialog';
import { START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_SURFACE } from '@/lib/ai/start-from-cv-contract';

const sessionId = '11111111-1111-4111-8111-111111111111';

const extractedDraftPayload = {
  importSessionId: sessionId,
  sourceType: 'cv',
  extractionStatus: 'completed',
  privacyWarnings: [],
  workContextDrafts: [
    {
      id: 'work-1',
      organizationLabel: 'Acme',
      roleTitle: 'Original role',
      approximateDates: '2021 - 2024',
      shortContextSummary: 'Original private context.',
      possibleProjectOutcomeCandidates: [],
      visibility: 'private',
    },
  ],
  educationContextDrafts: [],
  volunteeringContextDrafts: [],
  proofPackIdeaDrafts: [],
  artifactLinkDrafts: [],
  unsupportedSkillDrafts: [
    {
      id: 'skill-1',
      skillLabel: 'Original skill',
      sourceContext: 'Mentioned in redacted CV text.',
      status: 'unsupported_draft',
      requiresProof: true,
      requiresUserConfirmation: true,
      noTrustLift: true,
      noMatchingLift: true,
      noVerificationState: true,
    },
  ],
  discardedUnsafeItems: [],
  requiresUserReview: true,
};

function jsonResponse(payload: unknown, ok = true) {
  return {
    ok,
    json: async () => payload,
  };
}

async function createPrivateDrafts() {
  const file = new File(['%PDF-1.7'], 'candidate-cv.pdf', { type: 'application/pdf' });
  fireEvent.change(screen.getByLabelText('CV file'), {
    target: { files: [file] },
  });
  fireEvent.click(
    screen.getByLabelText('I consent to optional CV processing for private draft suggestions.')
  );
  fireEvent.click(screen.getByRole('button', { name: /create private drafts/i }));

  expect(await screen.findByDisplayValue('Original role')).toBeInTheDocument();
}

describe('StartFromCvDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiFetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          importSessionId: sessionId,
          sourceType: 'cv',
          extractionStatus: 'not_started',
          privacyWarnings: [],
          workContextDrafts: [],
          educationContextDrafts: [],
          volunteeringContextDrafts: [],
          proofPackIdeaDrafts: [],
          artifactLinkDrafts: [],
          unsupportedSkillDrafts: [],
          discardedUnsafeItems: [],
          requiresUserReview: true,
        })
      )
      .mockResolvedValueOnce(jsonResponse(extractedDraftPayload))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lets candidates edit imported drafts before accepting selected private scaffolding', async () => {
    const onApplyComplete = vi.fn();
    render(
      <StartFromCvDialog
        surface={START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_SURFACE}
        onApplyComplete={onApplyComplete}
      />
    );

    expect(screen.getByText(/workflow decisions/i)).toBeInTheDocument();
    expect(screen.queryByText(/hiring decisions/i)).not.toBeInTheDocument();
    await createPrivateDrafts();
    fireEvent.change(screen.getByLabelText('Work context drafts title'), {
      target: { value: 'Edited role' },
    });
    fireEvent.change(screen.getByLabelText('Work context drafts details'), {
      target: { value: 'Edited context before accepting.' },
    });
    fireEvent.click(screen.getByLabelText('Use Work context drafts: Edited role'));
    fireEvent.click(screen.getByRole('button', { name: /accept selected drafts/i }));

    await waitFor(() => expect(onApplyComplete).toHaveBeenCalledTimes(1));
    const acceptCall = apiFetchMock.mock.calls[2] as [string, RequestInit];
    const acceptedPayload = JSON.parse(String(acceptCall[1].body));

    expect(acceptCall[0]).toBe(`/api/ai/start-from-cv/sessions/${sessionId}/accept`);
    expect(acceptedPayload.accepted.workContextDrafts).toEqual([
      expect.objectContaining({
        id: 'work-1',
        roleTitle: 'Edited role',
        shortContextSummary: 'Edited context before accepting.',
        visibility: 'private',
      }),
    ]);
    expect(acceptedPayload.accepted.unsupportedSkillDrafts).toEqual([]);
    expect(JSON.stringify(acceptedPayload)).not.toMatch(/score|rank|shortlist|verifiedAt/i);
  });

  it('keeps private draft creation failures safe when the request fails before a session is created', async () => {
    apiFetchMock.mockReset();
    apiFetchMock.mockRejectedValueOnce(new Error('fetch failed: provider token expired'));

    render(<StartFromCvDialog surface={START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_SURFACE} />);

    const file = new File(['%PDF-1.7'], 'candidate-cv.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('CV file'), {
      target: { files: [file] },
    });
    fireEvent.click(
      screen.getByLabelText('I consent to optional CV processing for private draft suggestions.')
    );
    fireEvent.click(screen.getByRole('button', { name: /create private drafts/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Start from CV could not create private drafts. Your profile is unchanged; try again or continue manually.'
    );
    expect(alert).not.toHaveTextContent('fetch failed');
    expect(alert).not.toHaveTextContent('provider token expired');
    expect(screen.getByLabelText('CV file')).toBeInTheDocument();
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'start_from_cv.private_drafts.create_failed',
      expect.any(Error)
    );
    expect((dispatchClientErrorDiagnosticMock.mock.calls[0]?.[1] as Error).message).toBe(
      'fetch failed: provider token expired'
    );
  });

  it('keeps failed draft acceptance retryable without raw service text', async () => {
    apiFetchMock.mockReset();
    apiFetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          importSessionId: sessionId,
          sourceType: 'cv',
          extractionStatus: 'not_started',
          privacyWarnings: [],
          workContextDrafts: [],
          educationContextDrafts: [],
          volunteeringContextDrafts: [],
          proofPackIdeaDrafts: [],
          artifactLinkDrafts: [],
          unsupportedSkillDrafts: [],
          discardedUnsafeItems: [],
          requiresUserReview: true,
        })
      )
      .mockResolvedValueOnce(jsonResponse(extractedDraftPayload))
      .mockResolvedValueOnce(jsonResponse({ error: 'draft_accept_service token expired' }, false));

    render(<StartFromCvDialog surface={START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_SURFACE} />);

    await createPrivateDrafts();
    fireEvent.click(screen.getByLabelText('Use Work context drafts: Original role'));
    fireEvent.click(screen.getByRole('button', { name: /accept selected drafts/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Selected drafts could not be accepted. Your private drafts are still here; review them and try again.'
    );
    expect(alert).not.toHaveTextContent('draft_accept_service');
    expect(alert).not.toHaveTextContent('token expired');
    expect(screen.getByDisplayValue('Original role')).toBeInTheDocument();
    expect(screen.getByLabelText('Use Work context drafts: Original role')).toBeChecked();
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'start_from_cv.private_drafts.accept_failed',
      expect.any(Error)
    );
    expect((dispatchClientErrorDiagnosticMock.mock.calls[0]?.[1] as Error).message).toBe(
      'draft_accept_service token expired'
    );
  });

  it('confirms deletion before discarding a private CV import session', async () => {
    const onApplyComplete = vi.fn();
    render(
      <StartFromCvDialog
        surface={START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_SURFACE}
        onApplyComplete={onApplyComplete}
      />
    );

    await createPrivateDrafts();

    fireEvent.click(screen.getByRole('button', { name: /delete import session/i }));
    const dialog = screen.getByRole('alertdialog');

    expect(screen.getByRole('heading', { name: 'Delete import session?' })).toBeInTheDocument();
    expect(dialog).toHaveTextContent(/private CV draft session/i);
    expect(apiFetchMock).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole('button', { name: /keep drafts/i }));
    expect(apiFetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByDisplayValue('Original role')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /delete import session/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete session' }));

    await waitFor(() => expect(onApplyComplete).toHaveBeenCalledTimes(1));
    expect(apiFetchMock).toHaveBeenLastCalledWith(
      `/api/ai/start-from-cv/sessions/${sessionId}/discard`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ deleteSession: true }),
      })
    );
  });

  it('keeps the delete confirmation open when discarding the import session fails', async () => {
    apiFetchMock.mockReset();
    apiFetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          importSessionId: sessionId,
          sourceType: 'cv',
          extractionStatus: 'not_started',
          privacyWarnings: [],
          workContextDrafts: [],
          educationContextDrafts: [],
          volunteeringContextDrafts: [],
          proofPackIdeaDrafts: [],
          artifactLinkDrafts: [],
          unsupportedSkillDrafts: [],
          discardedUnsafeItems: [],
          requiresUserReview: true,
        })
      )
      .mockResolvedValueOnce(jsonResponse(extractedDraftPayload))
      .mockResolvedValueOnce(
        jsonResponse({ error: 'Could not delete this private draft yet. Please try again.' }, false)
      );
    const onApplyComplete = vi.fn();
    render(
      <StartFromCvDialog
        surface={START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_SURFACE}
        onApplyComplete={onApplyComplete}
      />
    );

    await createPrivateDrafts();

    fireEvent.click(screen.getByRole('button', { name: /delete import session/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete session' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not delete this private draft yet. Please try again.'
    );
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Original role')).toBeInTheDocument();
    expect(onApplyComplete).not.toHaveBeenCalled();
  });
});
