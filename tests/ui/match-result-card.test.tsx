import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MatchResultCard } from '@/components/matching/MatchResultCard';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { MATCH_EXPLAINER_TRIGGER_LABEL } from '@/lib/matching/explainer-contract';

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      layoutId: _layoutId,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & { layoutId?: string }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('@/components/matching/MatchExplainerModal', () => ({
  MatchExplainerModal: ({
    defaultOpen,
    reviewCard,
  }: {
    defaultOpen?: boolean;
    reviewCard?: { fitSummary?: { headline?: string } };
  }) => (
    <div>
      {defaultOpen ? 'Match explainer opened from first click' : 'Match explainer modal'}
      {reviewCard?.fitSummary?.headline ? <span>{reviewCard.fitSummary.headline}</span> : null}
    </div>
  ),
}));

vi.mock('@/components/matching/SnoozeDialog', () => ({
  SnoozeDialog: () => <div>Snooze dialog</div>,
}));

vi.mock('@/components/matching/VerificationGatesWarning', () => ({
  VerificationGatesWarning: () => <div>Verification gates warning</div>,
}));

vi.mock('@/components/matching/ConsentToShareDialog', () => ({
  ConsentToShareDialog: () => <div>Consent dialog</div>,
}));

const apiFetchMock = vi.mocked(apiFetch);
const dispatchClientErrorDiagnosticMock = vi.mocked(dispatchClientErrorDiagnostic);

describe('MatchResultCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses human match breakdown labels for individual assignment review cards', () => {
    render(
      <MatchResultCard
        result={{
          id: 'match-individual-1',
          assignmentId: 'assignment-1',
          assignment: {
            role: 'Proof operations lead',
            locationMode: 'remote',
            hoursMin: 24,
            hoursMax: 32,
          },
          proofSignals: [
            { key: 'proof_fit', support: 'Primary reason' },
            { key: 'skills_fit', support: 'Primary reason' },
            { key: 'verification_fit', support: 'Clear support' },
          ],
        }}
        variant="blind"
      />
    );

    expect(screen.getByText('Proof')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Trust')).toBeInTheDocument();
    expect(screen.getAllByText('Primary reason').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Clear support').length).toBeGreaterThan(0);
    expect(screen.queryByText('Proof_fit:')).not.toBeInTheDocument();
    expect(screen.queryByText('Skills_fit:')).not.toBeInTheDocument();
    expect(screen.queryByText('Verification_fit:')).not.toBeInTheDocument();
    expect(screen.queryByText('91%')).not.toBeInTheDocument();
  });

  it('keeps fallback card titles assignment and proof-submission scoped', () => {
    render(
      <>
        <MatchResultCard
          result={{
            id: 'match-individual-fallback',
            assignmentId: 'assignment-fallback',
            proofSignals: [{ key: 'proof_fit', support: 'Clear support' }],
          }}
          variant="blind"
        />
        <MatchResultCard
          result={{
            id: 'match-org-fallback',
            profileId: 'profile-fallback',
            reviewStage: 'blind_review',
            revealScope: 'blind',
            proofSignals: [{ key: 'proof_fit', support: 'Clear support' }],
          }}
          variant="blind"
        />
      </>
    );

    expect(screen.getByText('Assignment Match')).toBeInTheDocument();
    expect(screen.getByText('Proof Submission')).toBeInTheDocument();
    expect(screen.queryByText('Opportunity Match')).not.toBeInTheDocument();
    expect(screen.queryByText('Candidate Match')).not.toBeInTheDocument();
  });

  it('exposes review card titles as section headings for scanability', () => {
    render(
      <>
        <MatchResultCard
          result={{
            id: 'match-individual-heading',
            assignmentId: 'assignment-heading',
            assignment: {
              role: 'Proof operations lead',
            },
          }}
          variant="blind"
        />
        <MatchResultCard
          result={{
            id: 'match-org-heading',
            profileId: 'profile-heading',
            reviewStage: 'blind_review',
            revealScope: 'blind',
          }}
          variant="blind"
        />
      </>
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Proof operations lead' })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Proof Submission' })).toBeInTheDocument();
  });

  it('renders proof-first org review cards without score-first clutter', () => {
    render(
      <MatchResultCard
        result={{
          id: 'match-1',
          profileId: 'candidate-1',
          reviewStage: 'blind_review',
          revealScope: 'blind',
          profile: {
            workMode: 'Remote',
          },
          fairness: {
            status: 'pass',
          },
          reviewCard: {
            candidateLabel: 'Submission A7F2',
            strongestProof: {
              summary: 'Led a privacy-safe launch proof for a complex assignment-review workflow.',
              outcome: 'Reduced review time while keeping identity reveal masked.',
              ownership: 'Owned the end-to-end review flow changes.',
              anchorContext: 'Anchored in prior project work',
              freshnessLabel: 'Fresh',
            },
            verification: {
              summaryLabel: 'Verified proof signal present',
              count: 2,
            },
            trustLabels: ['Verified proof signal present', 'Auditable verification history'],
            fitBand: 'High-priority proof review',
            fitSummary: {
              headline: 'Proof signals align with the assignment needs.',
              bullets: [
                'Evidence points to a strong skills fit for this assignment.',
                'Required proof and verification signals are in place.',
              ],
              reasonCodes: ['skills_strong', 'verification_ready'],
            },
          },
        }}
        variant="blind"
      />
    );

    expect(screen.getByText('Submission A7F2')).toBeInTheDocument();
    expect(screen.getByText('Blind by default')).toBeInTheDocument();
    expect(screen.getByText('Review-ready proof')).toBeInTheDocument();
    expect(screen.getByText('Strongest relevant proof')).toBeInTheDocument();
    expect(
      screen.getByText('Led a privacy-safe launch proof for a complex assignment-review workflow.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Outcome: Reduced review time while keeping identity reveal masked.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Ownership: Owned the end-to-end review flow changes.')
    ).toBeInTheDocument();
    expect(screen.getByText('Anchored in prior project work')).toBeInTheDocument();
    expect(screen.getByText('Fresh')).toBeInTheDocument();
    expect(screen.getByText('Verified proof signal present')).toBeInTheDocument();
    expect(screen.getByText('Auditable verification history')).toBeInTheDocument();
    expect(screen.getByText('Proof alignment summary')).toBeInTheDocument();
    expect(screen.getByText('Strong skills evidence')).toBeInTheDocument();
    expect(screen.getByText('Verification ready')).toBeInTheDocument();
    expect(screen.queryByText('Reason-coded fit summary')).not.toBeInTheDocument();
    expect(screen.queryByText('skills_strong')).not.toBeInTheDocument();
    expect(screen.queryByText('verification_ready')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: MATCH_EXPLAINER_TRIGGER_LABEL })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Shortlist' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pass' })).toBeInTheDocument();
    expect(screen.queryByText('82% Match')).not.toBeInTheDocument();
    expect(screen.queryByText('Match breakdown:')).not.toBeInTheDocument();
    expect(screen.queryByText('Top 10')).not.toBeInTheDocument();
    expect(screen.queryByText(/complex hiring workflow/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/candidate identity masked/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /snooze/i })).not.toBeInTheDocument();
  });

  it('names the explainer loading state as proof reasoning work', async () => {
    apiFetchMock.mockReturnValue(new Promise(() => undefined));

    render(
      <MatchResultCard
        result={{
          id: 'match-loading',
          assignmentId: 'assignment-loading',
          assignment: {
            role: 'Proof operations lead',
          },
          proofSignals: [{ key: 'proof_fit', support: 'Primary reason' }],
        }}
        variant="blind"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: MATCH_EXPLAINER_TRIGGER_LABEL }));

    expect(await screen.findByRole('button', { name: /loading proof reasoning/i })).toBeDisabled();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('keeps match explainer failures visible and retryable', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Failed to build summary' }),
    } as any);

    render(
      <MatchResultCard
        result={{
          id: 'match-explainer-failure',
          assignmentId: 'assignment-failure',
          assignment: {
            role: 'Proof operations lead',
          },
          proofSignals: [{ key: 'proof_fit', support: 'Primary reason' }],
        }}
        variant="blind"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: MATCH_EXPLAINER_TRIGGER_LABEL }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Proof reasoning could not load');
    expect(alert).toHaveTextContent('Your match review is unchanged; try again.');
    expect(screen.getByRole('button', { name: MATCH_EXPLAINER_TRIGGER_LABEL })).toBeEnabled();
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'matching.result_card.explanation_fetch_failed',
      expect.any(Error)
    );
  });

  it('passes proof-first review card content into individual explainers', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        matchId: 'match-with-review-card',
        reviewCard: {
          candidateLabel: 'Proof operations lead',
          strongestProof: {
            summary:
              'A recent Proof Pack shows structured proof operations work for a privacy-safe assignment review.',
            outcome:
              'Reviewer-facing proof, constraints, and privacy gates stay inspectable before reveal.',
            ownership: 'Proof-review participant owned the supporting work.',
            anchorContext: 'Proof Pack evidence',
            freshnessLabel: 'Recent proof signal',
          },
          verification: {
            summaryLabel: 'Privacy-ready proof signals present',
            count: 2,
          },
          trustLabels: ['Blind by default', 'Privacy ready'],
          fitBand: 'High-priority proof review',
          fitSummary: {
            headline: 'Strong proof signals align with this assignment review.',
            bullets: ['Core assignment skills have proof-backed support.'],
            reasonCodes: ['skills_fit_high'],
          },
        },
      }),
    } as any);

    render(
      <MatchResultCard
        result={{
          id: 'match-with-review-card',
          assignmentId: 'assignment-with-review-card',
          assignment: {
            role: 'Proof operations lead',
          },
          proofSignals: [{ key: 'proof_fit', support: 'Primary reason' }],
        }}
        variant="blind"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: MATCH_EXPLAINER_TRIGGER_LABEL }));

    expect(
      await screen.findByText('Strong proof signals align with this assignment review.')
    ).toBeInTheDocument();
  });

  it('opens the proof explainer from the first successful click', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        matchId: 'match-first-click',
        reviewCard: {
          candidateLabel: 'Proof operations lead',
          strongestProof: {
            summary:
              'A recent Proof Pack shows structured proof operations work for a privacy-safe assignment review.',
            outcome:
              'Reviewer-facing proof, constraints, and privacy gates stay inspectable before reveal.',
            ownership: 'Proof-review participant owned the supporting work.',
            anchorContext: 'Proof Pack evidence',
            freshnessLabel: 'Recent proof signal',
          },
          verification: {
            summaryLabel: 'Privacy-ready proof signals present',
            count: 2,
          },
          trustLabels: ['Blind by default', 'Privacy ready'],
          fitBand: 'High-priority proof review',
          fitSummary: {
            headline: 'Strong proof signals align with this assignment review.',
            bullets: ['Core assignment skills have proof-backed support.'],
            reasonCodes: ['skills_fit_high'],
          },
        },
      }),
    } as any);

    render(
      <MatchResultCard
        result={{
          id: 'match-first-click',
          assignmentId: 'assignment-first-click',
          assignment: {
            role: 'Proof operations lead',
          },
          proofSignals: [{ key: 'proof_fit', support: 'Primary reason' }],
        }}
        variant="blind"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: MATCH_EXPLAINER_TRIGGER_LABEL }));

    expect(await screen.findByText('Match explainer opened from first click')).toBeInTheDocument();
    expect(apiFetchMock).toHaveBeenCalledTimes(1);
  });

  it('shows fallback explanation signals when org match review bullets are sparse', () => {
    render(
      <MatchResultCard
        result={{
          id: 'match-2',
          score: 0.71,
          profileId: 'candidate-2',
          reviewStage: 'blind_review',
          revealScope: 'blind',
          profile: {
            workMode: 'Remote',
          },
          contributions: {
            skills: 0.42,
            proof: 0.31,
            constraints: 0.22,
          },
        }}
        variant="blind"
        skills={[
          { id: 'program-management', label: 'Program management', level: 4 },
          { id: 'stakeholder-coordination', label: 'Stakeholder coordination', level: 3 },
        ]}
      />
    );

    expect(screen.getByText('Proof alignment summary')).toBeInTheDocument();
    expect(screen.getByText(/Matched skills: Program management/i)).toBeInTheDocument();
    expect(screen.getByText(/Practical alignment is checked/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        'Blind-by-default review keeps identity details hidden until the proof-review participant consents to reveal.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/candidate consent/i)).not.toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Proof')).toBeInTheDocument();
    expect(screen.getByText('Constraints')).toBeInTheDocument();
    expect(screen.queryByText('Reason-coded fit summary')).not.toBeInTheDocument();
    expect(screen.queryByText('Fit signal summary')).not.toBeInTheDocument();
    expect(screen.queryByText('skills')).not.toBeInTheDocument();
    expect(screen.queryByText('proof')).not.toBeInTheDocument();
    expect(screen.queryByText('constraints')).not.toBeInTheDocument();
  });
});
