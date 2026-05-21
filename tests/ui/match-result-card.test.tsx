import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MatchResultCard } from '@/components/matching/MatchResultCard';
import { MATCH_EXPLAINER_TRIGGER_LABEL } from '@/lib/matching/explainer-contract';

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
  MatchExplainerModal: () => <div>Match explainer modal</div>,
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

describe('MatchResultCard', () => {
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
              ownership: 'Owned the end-to-end review corridor changes.',
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
    expect(screen.getByText('High-priority proof review')).toBeInTheDocument();
    expect(screen.getByText('Strongest relevant proof')).toBeInTheDocument();
    expect(
      screen.getByText('Led a privacy-safe launch proof for a complex assignment-review workflow.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Outcome: Reduced review time while keeping identity reveal masked.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Ownership: Owned the end-to-end review corridor changes.')
    ).toBeInTheDocument();
    expect(screen.getByText('Anchored in prior project work')).toBeInTheDocument();
    expect(screen.getByText('Fresh')).toBeInTheDocument();
    expect(screen.getByText('Verified proof signal present')).toBeInTheDocument();
    expect(screen.getByText('Auditable verification history')).toBeInTheDocument();
    expect(screen.getByText('Reason-coded fit summary')).toBeInTheDocument();
    expect(screen.getByText('skills_strong')).toBeInTheDocument();
    expect(screen.getByText('verification_ready')).toBeInTheDocument();
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

  it('uses policy language when a protected org review cannot expose matching detail', () => {
    render(
      <MatchResultCard
        result={{
          id: 'match-policy-protected',
          profileId: 'candidate-1',
          reviewStage: 'blind_review',
          revealScope: 'blind',
          profile: {
            workMode: 'Remote',
          },
          fairness: {
            status: 'suppressed',
          },
          reviewCard: {
            candidateLabel: 'Submission A7F2',
            strongestProof: {
              summary: 'Led a privacy-safe launch proof for a complex assignment-review workflow.',
              outcome: 'Reduced review time while keeping identity reveal masked.',
              ownership: 'Owned the end-to-end review corridor changes.',
              anchorContext: 'Anchored in prior project work',
              freshnessLabel: 'Fresh',
            },
            verification: {
              summaryLabel: 'Verified proof signal present',
              count: 2,
            },
            trustLabels: ['Verified proof signal present'],
            fitBand: 'High-priority proof review',
            fitSummary: {
              headline: 'Proof signals align with the assignment needs.',
              bullets: ['Required proof and verification signals are in place.'],
              reasonCodes: ['verification_ready'],
            },
          },
        }}
        variant="blind"
      />
    );

    expect(screen.getByText('Policy protected')).toBeInTheDocument();
    expect(screen.queryByText(/fairness/i)).not.toBeInTheDocument();
  });

  it('keeps individual cards qualitative instead of score or rank led', () => {
    render(
      <MatchResultCard
        result={{
          id: 'match-individual-2',
          assignmentId: 'assignment-2',
          assignment: {
            role: 'Proof operations lead',
            locationMode: 'remote',
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

    expect(screen.getByText('Proof signals available')).toBeInTheDocument();
    expect(screen.getByText('Blind by default')).toBeInTheDocument();
    expect(
      screen.getByText('Verification check visible only within this review stage')
    ).toBeInTheDocument();
    expect(screen.queryByText(/% proof fit/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ranking band/i)).not.toBeInTheDocument();
    expect(screen.queryByText('91%')).not.toBeInTheDocument();
    expect(screen.queryByText('Strong proof alignment')).not.toBeInTheDocument();
    expect(screen.queryByText('Clear proof alignment')).not.toBeInTheDocument();
    expect(screen.queryByText(/verified profile/i)).not.toBeInTheDocument();
  });
});
