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

vi.mock('@/components/matching/PACScoreExplainer', () => ({
  PACScoreExplainer: () => <div>PAC explainer</div>,
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

vi.mock('@/components/matching/RankDisplay', () => ({
  RankDisplay: () => <div>Rank display</div>,
}));

vi.mock('@/components/matching/ConsentToShareDialog', () => ({
  ConsentToShareDialog: () => <div>Consent dialog</div>,
}));

describe('MatchResultCard', () => {
  it('renders proof-first org review cards without score-first clutter', () => {
    render(
      <MatchResultCard
        result={{
          id: 'match-1',
          score: 0.82,
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
            candidateLabel: 'Candidate A7F2',
            strongestProof: {
              summary: 'Led a privacy-safe launch proof for a complex hiring workflow.',
              outcome: 'Reduced review time while keeping candidate identity masked.',
              ownership: 'Owned the end-to-end review corridor changes.',
              anchorContext: 'Anchored in prior project work',
              freshnessLabel: 'Fresh',
            },
            verification: {
              summaryLabel: 'Verified proof signal present',
              count: 2,
            },
            trustLabels: ['Verified proof signal present', 'Auditable verification history'],
            fitBand: 'Top 10',
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

    expect(screen.getByText('Candidate A7F2')).toBeInTheDocument();
    expect(screen.getByText('Blind by default')).toBeInTheDocument();
    expect(screen.getByText('Top 10')).toBeInTheDocument();
    expect(screen.getByText('Strongest relevant proof')).toBeInTheDocument();
    expect(
      screen.getByText('Led a privacy-safe launch proof for a complex hiring workflow.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Outcome: Reduced review time while keeping candidate identity masked.')
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
    expect(screen.queryByRole('button', { name: /snooze/i })).not.toBeInTheDocument();
  });
});
