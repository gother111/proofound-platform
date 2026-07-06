import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { OrgShortlistClient, type ShortlistItem } from '@/components/shortlist/OrgShortlistClient';

const shortlistItem: ShortlistItem = {
  id: 'shortlist-1',
  assignmentId: 'assignment-1',
  assignmentRole: 'Proof operations lead',
  assignmentStatus: 'active',
  reviewStage: 'shortlisted',
  revealScope: 'shortlist_identity',
  visibleIdentityFields: [],
  candidate: {
    id: 'candidate-1',
    displayName: null,
    headline: null,
    tagline: null,
    desiredRoles: [],
    workMode: null,
    verificationSummary: 2,
  },
  fairness: {
    status: 'pass',
  },
  reviewCard: {
    candidateLabel: 'Submission A',
    strongestProof: {
      summary: 'Reduced verification turnaround with a proof-first queue.',
      outcome: 'Review time fell from days to hours.',
      ownership: 'Owned queue design and launch handoff.',
      anchorContext: 'Work sample',
      freshnessLabel: 'Recent',
    },
    verification: {
      summaryLabel: 'Two verification checks',
      count: 2,
    },
    trustLabels: ['Verified work email'],
    fitBand: 'High-priority proof review',
    fitSummary: {
      headline: 'Strong proof for the assignment corridor.',
      bullets: ['Relevant operational proof is attached.'],
      reasonCodes: ['proof_relevance_strong'],
    },
  },
  rankBand: 'High-priority proof review',
  shortlistedAt: '2026-05-20T10:00:00.000Z',
};

describe('OrgShortlistClient launch copy', () => {
  it('uses proof-review language instead of rank, fairness, or public-directory copy', () => {
    render(<OrgShortlistClient items={[shortlistItem]} />);

    expect(screen.getByRole('option', { name: 'Review priority' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Submission label, role focus, reason')).toBeInTheDocument();
    expect(screen.getByText('1 proof submission')).toBeInTheDocument();
    expect(
      screen.getByText(/Review proof submissions through proof, practical fit, and trust signals/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Policy check: pass')).toBeInTheDocument();

    expect(screen.queryByText(/Review candidates through proof/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /rank band/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/fairness:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/1 candidate/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/candidate label/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/name, role focus, value/i)).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/marketplace|directory|leaderboard/i);
  });

  it('keeps fallback labels proof-submission scoped', () => {
    render(
      <OrgShortlistClient
        items={[
          {
            ...shortlistItem,
            reviewCard: undefined,
          },
        ]}
      />
    );

    expect(screen.getByText('Proof submission')).toBeInTheDocument();
    expect(
      screen.getByText(/Reveal stays limited until the proof-review participant consents/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/until the candidate consents/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Candidate')).not.toBeInTheDocument();
  });
});
