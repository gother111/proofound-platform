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
          skillMappingDrafts: [],
          outcomeQuestionDrafts: [],
          futureProjectIdeaDrafts: [],
          discardedUnsafeItems: [],
          providerPolicyWarnings: [],
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
              sourceSpans: [{ label: 'CV snippet', text: 'Original private context.' }],
              epistemicStatus: 'explicit',
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
              sourceSpans: [],
              epistemicStatus: 'explicit',
              evidenceClass: 'unsupported_skill',
            },
          ],
          skillMappingDrafts: [],
          outcomeQuestionDrafts: [
            {
              id: 'question-1',
              anchorDraftId: 'work-1',
              question: 'What measurable outcome belongs here?',
              whyItMatters: 'Proof needs evidence-backed outcomes.',
              sourceSpans: [],
              epistemicStatus: 'inferred',
              status: 'draft_only',
            },
          ],
          futureProjectIdeaDrafts: [
            {
              id: 'future-1',
              titleSuggestion: 'Future proof idea',
              prompt: 'Create proof only after evidence exists.',
              sourceContext: 'Suggested from a skill mention.',
              sourceSpans: [],
              epistemicStatus: 'future_idea',
              notCvFact: true,
              status: 'future_idea',
            },
          ],
          discardedUnsafeItems: [],
          providerPolicyWarnings: [],
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
    fireEvent.click(screen.getByRole('button', { name: /create private proof drafts/i }));

    expect(await screen.findByDisplayValue('Original role')).toBeInTheDocument();
    expect(screen.getAllByText('Found in document').length).toBeGreaterThan(0);
    expect(screen.getByText('Inferred - confirm')).toBeInTheDocument();
    expect(screen.getByText('Future idea')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Work context drafts title'), {
      target: { value: 'Edited role' },
    });
    fireEvent.change(screen.getByLabelText('Work context drafts details'), {
      target: { value: 'Edited context before accepting.' },
    });
    fireEvent.click(screen.getByLabelText('Use Work context drafts: Edited role'));
    fireEvent.click(screen.getByRole('button', { name: /save selected drafts/i }));

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
    expect(acceptedPayload.accepted.futureProjectIdeaDrafts).toEqual([]);
    expect(JSON.stringify(acceptedPayload)).not.toMatch(/score|rank|shortlist|verifiedAt/i);
  });

  it('shows a manual continuation state when extraction returns no safe draft suggestions', async () => {
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
          skillMappingDrafts: [],
          outcomeQuestionDrafts: [],
          futureProjectIdeaDrafts: [],
          discardedUnsafeItems: [],
          providerPolicyWarnings: [],
          requiresUserReview: true,
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          importSessionId: sessionId,
          sourceType: 'cv',
          extractionStatus: 'completed',
          privacyWarnings: [],
          workContextDrafts: [],
          educationContextDrafts: [],
          volunteeringContextDrafts: [],
          proofPackIdeaDrafts: [],
          artifactLinkDrafts: [],
          unsupportedSkillDrafts: [],
          skillMappingDrafts: [],
          outcomeQuestionDrafts: [],
          futureProjectIdeaDrafts: [],
          discardedUnsafeItems: [],
          providerPolicyWarnings: [],
          requiresUserReview: true,
        })
      );
    const onApplyComplete = vi.fn();

    render(
      <StartFromCvDialog
        surface={START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_SURFACE}
        onApplyComplete={onApplyComplete}
      />
    );

    const file = new File(['%PDF-1.7'], 'empty-cv.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('CV file'), {
      target: { files: [file] },
    });
    fireEvent.click(
      screen.getByLabelText('I consent to optional CV processing for private draft suggestions.')
    );
    fireEvent.click(screen.getByRole('button', { name: /create private proof drafts/i }));

    expect(await screen.findByText('No private draft suggestions found')).toBeInTheDocument();
    expect(screen.getByText(/continue manually and add the proof/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save selected drafts/i })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /continue manually/i }));
    expect(onApplyComplete).toHaveBeenCalledTimes(1);
  });
});
