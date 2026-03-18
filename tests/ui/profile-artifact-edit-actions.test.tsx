import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ImpactTab } from '@/components/profile/editable-profile/ImpactTab';
import { ProfileTabsSection } from '@/components/profile/editable-profile/ProfileTabsSection';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: any) => <button data-value={value}>{children}</button>,
  TabsContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, asChild, ...props }: any) =>
    asChild ? <div>{children}</div> : <button {...props}>{children}</button>,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: any) => <div>{children}</div>,
  },
}));

describe('profile launch IA', () => {
  it('replaces legacy profile tabs with launch IA labels', () => {
    render(
      <ProfileTabsSection
        impactStories={[]}
        experiences={[]}
        education={[]}
        volunteering={[]}
        completionState={{
          stage: 'first_proof',
          checks: {
            hasDisplayName: true,
            hasHandle: true,
            hasHeadlineOrBio: true,
            hasLocationOrTimezone: true,
            hasTargetRoleFocus: true,
            hasWorkPreference: true,
            hasEngagementPreference: true,
            hasLegacyShellCompatibility: true,
            hasSafeShell: true,
            hasRealContext: true,
            hasFirstProof: false,
            hasStructuredProofPack: false,
            hasProofForPublishing: false,
            hasPublishedPortfolio: false,
            hasOptionalVerification: false,
          },
          counts: {
            contexts: 1,
            values: 0,
            causes: 0,
            skills: 0,
            proofPacks: 0,
            anchoredProofPacks: 0,
            proofArtifacts: 0,
            acceptedVerifications: 0,
          },
          isCoreProfileComplete: true,
          isPortfolioReady: false,
          portfolioLockCode: 'proof',
          portfolioLockReason:
            'Add at least one anchored Proof Pack before your portfolio can be ready.',
        }}
        proofArtifactCount={0}
        acceptedVerificationCount={0}
        isPending={false}
        impactPending={false}
        onAddImpactStory={vi.fn()}
        onEditImpactStory={vi.fn()}
        onDeleteImpactStory={vi.fn()}
        onAddExperience={vi.fn()}
        onEditExperience={vi.fn()}
        onDeleteExperience={vi.fn()}
        onAddEducation={vi.fn()}
        onEditEducation={vi.fn()}
        onDeleteEducation={vi.fn()}
        onAddVolunteering={vi.fn()}
        onEditVolunteering={vi.fn()}
        onDeleteVolunteering={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Context' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Proof Packs' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Verification' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Visibility / Portfolio' })).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: /journey/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /learning/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /service/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /proof stories/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /network/i })).not.toBeInTheDocument();
  });

  it('shows proof-pack blockers and a direct add-proof path', () => {
    render(
      <ImpactTab
        impactStories={[]}
        onAddStory={vi.fn()}
        onEditStory={vi.fn()}
        onDeleteStory={vi.fn()}
        actionsDisabled={false}
        completionState={{
          stage: 'proof_pack',
          checks: {
            hasDisplayName: true,
            hasHandle: true,
            hasHeadlineOrBio: true,
            hasLocationOrTimezone: true,
            hasTargetRoleFocus: true,
            hasWorkPreference: true,
            hasEngagementPreference: true,
            hasLegacyShellCompatibility: true,
            hasSafeShell: true,
            hasRealContext: true,
            hasFirstProof: false,
            hasStructuredProofPack: false,
            hasProofForPublishing: false,
            hasPublishedPortfolio: false,
            hasOptionalVerification: false,
          },
          counts: {
            contexts: 1,
            values: 0,
            causes: 0,
            skills: 0,
            proofPacks: 0,
            anchoredProofPacks: 0,
            proofArtifacts: 0,
            acceptedVerifications: 0,
          },
          isCoreProfileComplete: true,
          isPortfolioReady: false,
          portfolioLockCode: 'proof',
          portfolioLockReason:
            'Add at least one anchored Proof Pack before your portfolio can be ready.',
        }}
        proofArtifactCount={0}
        acceptedVerificationCount={0}
      />
    );

    expect(screen.getByText(/proof packs/i)).toBeInTheDocument();
    expect(screen.getByText(/readiness blockers/i)).toBeInTheDocument();
    expect(screen.getByText(/add your first proof link or artifact/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /add your first proof/i })).toHaveAttribute(
      'href',
      '/app/i/portfolio'
    );
  });
});
