import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MatchResultCard } from '@/components/matching/MatchResultCard';

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
  it('renders org blind review cards without crashing when contribution data is missing', () => {
    render(
      <MatchResultCard
        result={{
          id: 'match-1',
          score: 0.82,
          profileId: 'candidate-1',
          profile: {
            workMode: 'Remote',
          },
        }}
        variant="blind"
      />
    );

    expect(screen.getByText('Candidate Match')).toBeInTheDocument();
    expect(screen.getByText('82% Match')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /why this match/i })).toBeInTheDocument();
    expect(screen.getByText('Remote')).toBeInTheDocument();
  });
});
