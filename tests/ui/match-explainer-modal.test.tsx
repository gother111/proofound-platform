import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MatchExplainerModal } from '@/components/matching/MatchExplainerModal';

vi.mock('@/hooks/use-responsive-modal-mode', () => ({
  useResponsiveModalMode: () => true,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogTrigger: ({ children, asChild }: { children: React.ReactElement; asChild?: boolean }) => {
    if (asChild) {
      return children;
    }
    return <button type="button">{children}</button>;
  },
}));

vi.mock('@/components/ui/drawer', () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DrawerTrigger: ({ children, asChild }: { children: React.ReactElement; asChild?: boolean }) => {
    if (asChild) {
      return children;
    }
    return <button type="button">{children}</button>;
  },
}));

describe('MatchExplainerModal', () => {
  it('renders privacy-safe explanation summary and fairness warning', () => {
    render(
      <MatchExplainerModal
        matchId="match-1"
        compositeScore={0.82}
        rankBand="Top 10"
        rankMode="band"
        exactRankAvailable
        fairnessWarning="Exact ranking detail is suppressed while fairness remediation is active."
        reasonSummary={[
          'Evidence points to a strong skills fit for this assignment.',
          'The organization has requested reveal. Identity-bearing fields stay hidden until you approve.',
        ]}
        reasonSections={{
          manual_override: ['A reviewer manually shortlisted this candidate.'],
        }}
        reviewCard={{
          candidateLabel: 'Candidate A7F2',
          strongestProof: {
            summary: 'Built a blind review corridor around proof-backed evaluation.',
            outcome: 'Made fit clearer without exposing identity-bearing fields.',
            ownership: 'Owned the review architecture and delivery.',
            anchorContext: 'Anchored in prior project work',
            freshnessLabel: 'Fresh',
          },
          verification: {
            summaryLabel: 'Verified proof signal present',
            count: 2,
          },
          fitSummary: {
            headline: 'Proof signals align with the role needs.',
            bullets: ['Evidence points to a strong skills fit for this assignment.'],
            reasonCodes: ['skills_strong'],
          },
        }}
        subscores={{
          skills: 0.9,
          pac: 0.7,
          constraints: 0.8,
          recency: 0.75,
          evidence: 0.9,
        }}
        skillsMatch={{ required: [], nice: [] }}
        pac={{
          valuesOverlap: 0.5,
          causesOverlap: 0.5,
          sharedValues: ['privacy'],
          sharedCauses: ['education'],
          totalValues: 2,
          totalCauses: 2,
        }}
        constraints={{
          location: { match: true, details: 'Remote' },
          salary: { match: true, details: 'USD 100000-120000' },
          hours: { match: true, details: '40 hours/week' },
          workMode: { match: true, details: 'Remote' },
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /why this match/i }));

    expect(screen.getByText('Proof-Backed Fit Review')).toBeInTheDocument();
    expect(screen.getByText('Strongest relevant proof')).toBeInTheDocument();
    expect(
      screen.getByText('Built a blind review corridor around proof-backed evaluation.')
    ).toBeInTheDocument();
    expect(screen.getByText('Reason-coded fit summary')).toBeInTheDocument();
    expect(screen.getByText('Privacy-safe explanation')).toBeInTheDocument();
    expect(
      screen.getAllByText('Evidence points to a strong skills fit for this assignment.')
    ).toHaveLength(2);
    expect(screen.getByText('A reviewer manually shortlisted this candidate.')).toBeInTheDocument();
    expect(screen.getByText('Comparative score detail')).toBeInTheDocument();
    expect(
      screen.getByText('Exact ranking detail is suppressed while fairness remediation is active.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Exact rank is hidden while privacy or fairness limits apply.')
    ).toBeInTheDocument();
  });
});
