import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MatchExplainerModal } from '@/components/matching/MatchExplainerModal';
import {
  MATCH_EXPLAINER_DIALOG_DESCRIPTION,
  MATCH_EXPLAINER_TEST_IDS,
  MATCH_EXPLAINER_TITLE,
  MATCH_EXPLAINER_TRIGGER_LABEL,
} from '@/lib/matching/explainer-contract';

vi.mock('@/hooks/use-responsive-modal-mode', () => ({
  useResponsiveModalMode: () => true,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  DialogHeader: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  DialogTitle: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLHeadingElement> & { children: React.ReactNode }) => (
    <h2 {...props}>{children}</h2>
  ),
  DialogDescription: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLParagraphElement> & { children: React.ReactNode }) => (
    <p {...props}>{children}</p>
  ),
  DialogTrigger: ({ children, asChild }: { children: React.ReactElement; asChild?: boolean }) => {
    if (asChild) {
      return children;
    }
    return <button type="button">{children}</button>;
  },
}));

vi.mock('@/components/ui/drawer', () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerContent: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  DrawerHeader: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  DrawerTitle: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLHeadingElement> & { children: React.ReactNode }) => (
    <h2 {...props}>{children}</h2>
  ),
  DrawerDescription: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLParagraphElement> & { children: React.ReactNode }) => (
    <p {...props}>{children}</p>
  ),
  DrawerTrigger: ({ children, asChild }: { children: React.ReactElement; asChild?: boolean }) => {
    if (asChild) {
      return children;
    }
    return <button type="button">{children}</button>;
  },
}));

describe('MatchExplainerModal', () => {
  it('renders privacy-safe explanation summary and policy warning', () => {
    render(
      <MatchExplainerModal
        matchId="match-1"
        rankBand="High-priority proof review"
        rankMode="band"
        exactRankAvailable
        fairnessWarning="Exact ordering detail is suppressed while policy review is active."
        reasonSummary={[
          'Evidence points to a strong skills fit for this assignment.',
          'The organization has requested reveal. Identity-bearing fields stay hidden until you approve.',
        ]}
        reasonSections={{
          manual_override: ['A reviewer manually shortlisted this proof-review participant.'],
        }}
        reviewCard={{
          candidateLabel: 'Submission A7F2',
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
          trustLabels: ['Verified proof signal present', 'Auditable verification history'],
          fitBand: 'High-priority proof review',
          fitSummary: {
            headline: 'Proof signals align with the role needs.',
            bullets: ['Evidence points to a strong skills fit for this assignment.'],
            reasonCodes: ['skills_strong'],
          },
        }}
        proofSignals={{
          skills: 'Strong proof support',
          constraints: 'Clear support',
          recency: 'Clear support',
          evidence: 'Strong proof support',
        }}
        skillsMatch={{ required: [], nice: [] }}
        constraints={{
          location: { match: true, details: 'Remote' },
          salary: { match: true, details: 'USD 100000-120000' },
          hours: { match: true, details: '40 hours/week' },
          workMode: { match: true, details: 'Remote' },
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: MATCH_EXPLAINER_TRIGGER_LABEL }));

    expect(screen.getByRole('heading', { name: MATCH_EXPLAINER_TITLE })).toBeInTheDocument();
    expect(screen.getByText(MATCH_EXPLAINER_DIALOG_DESCRIPTION)).toBeInTheDocument();
    expect(screen.getByTestId(MATCH_EXPLAINER_TEST_IDS.title)).toHaveTextContent(
      MATCH_EXPLAINER_TITLE
    );
    expect(screen.getByTestId(MATCH_EXPLAINER_TEST_IDS.description)).toHaveTextContent(
      MATCH_EXPLAINER_DIALOG_DESCRIPTION
    );
    expect(screen.getByText('Strongest relevant proof')).toBeInTheDocument();
    expect(screen.getAllByText('Review-ready proof').length).toBeGreaterThan(0);
    expect(
      screen.getByText('Built a blind review corridor around proof-backed evaluation.')
    ).toBeInTheDocument();
    expect(screen.getByText('Fit signal summary')).toBeInTheDocument();
    expect(screen.getByText('Strong skills evidence')).toBeInTheDocument();
    expect(screen.queryByText('Reason-coded fit summary')).not.toBeInTheDocument();
    expect(screen.queryByText('skills_strong')).not.toBeInTheDocument();
    expect(screen.getByText('Privacy-safe explanation')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Blind-by-default review keeps identity-bearing details hidden until the proof-review participant consents to reveal.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getAllByText('Evidence points to a strong skills fit for this assignment.')
    ).toHaveLength(2);
    expect(
      screen.getByText('A reviewer manually shortlisted this proof-review participant.')
    ).toBeInTheDocument();
    expect(screen.getByText('Auditable verification history')).toBeInTheDocument();
    expect(screen.queryByText('Comparative score detail')).not.toBeInTheDocument();
    expect(
      screen.getByText('Exact ordering detail is suppressed while policy review is active.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Exact ordering is hidden while privacy or policy limits apply.')
    ).toBeInTheDocument();
    expect(screen.getByText('Supporting fit signal')).toBeInTheDocument();
    expect(screen.getByText('Review signals by area')).toBeInTheDocument();
    expect(screen.getByText('Skills evidence')).toBeInTheDocument();
    expect(screen.getByText('Practical constraints')).toBeInTheDocument();
    expect(screen.getByText('Proof freshness')).toBeInTheDocument();
    expect(screen.getByText('Verification support')).toBeInTheDocument();
    expect(screen.queryByText('82%')).not.toBeInTheDocument();
    expect(screen.queryByText('90%')).not.toBeInTheDocument();
    expect(screen.queryByText('Top 10')).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'This fit signal summarizes proof strength, fit rationale, and practical constraints after the privacy-safe review context above.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/fairness/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ranking/i)).not.toBeInTheDocument();
  });
});
