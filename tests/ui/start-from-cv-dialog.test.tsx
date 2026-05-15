import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiFetchMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

import { StartFromCvDialog } from '@/components/profile/StartFromCvDialog';
import { START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_SURFACE } from '@/lib/ai/start-from-cv-contract';

const sessionId = '11111111-1111-4111-8111-111111111111';

function jsonResponse(payload: unknown, ok = true) {
  return {
    ok,
    json: async () => payload,
  };
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
      .mockResolvedValueOnce(
        jsonResponse({
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
        })
      )
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

    const file = new File(['%PDF-1.7'], 'candidate-cv.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('CV file'), {
      target: { files: [file] },
    });
    fireEvent.click(
      screen.getByLabelText('I consent to optional CV processing for private draft suggestions.')
    );
    fireEvent.click(screen.getByRole('button', { name: /create private drafts/i }));

    expect(await screen.findByDisplayValue('Original role')).toBeInTheDocument();
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
});
