import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ImpactTab } from '@/components/profile/editable-profile/ImpactTab';
import { ProfileTabsSection } from '@/components/profile/editable-profile/ProfileTabsSection';
import { VisibilityPortfolioTab } from '@/components/profile/editable-profile/VisibilityPortfolioTab';
import type { ProfileProofPack } from '@/types/profile';

const startFromCvStatus = vi.hoisted(() => ({
  visible: false,
  available: false,
  blockers: [] as string[],
}));

vi.mock('@/hooks/useStartFromCvBetaStatus', () => ({
  useStartFromCvBetaStatus: () => startFromCvStatus,
}));

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

function getTabTrigger(name: string) {
  return screen.getAllByRole('button', { name }).find((node) => node.hasAttribute('data-value'));
}

function queryTabTrigger(pattern: RegExp) {
  return screen
    .queryAllByRole('button')
    .find((node) => node.hasAttribute('data-value') && pattern.test(node.textContent || ''));
}

function makeProofPack(overrides: Partial<ProfileProofPack>): ProfileProofPack {
  return {
    id: 'pack-1',
    title: 'Launch proof pack',
    summary: 'Proof of launch work.',
    primaryClaim: 'Shipped a launch workflow with measurable outcomes.',
    contextType: 'experience',
    contextLabel: 'Primary work context',
    outcomesSummary: 'Reduced review time by 23%.',
    evidenceSummary: 'Launch memo and implementation artifact.',
    ownershipStatement: 'Owned implementation and review flow.',
    roleContext: 'Product engineering',
    timeframeLabel: 'Q1 pilot',
    verificationStatus: 'verified',
    verificationSummary: 'Scoped verification supports this Proof Pack.',
    freshnessState: 'fresh',
    visibility: 'public',
    revealGate: 'none',
    proofQualityScore: 0.9,
    createdAt: '2026-05-10T10:00:00.000Z',
    updatedAt: '2026-05-10T10:00:00.000Z',
    lastVerifiedAt: '2026-05-11T10:00:00.000Z',
    lastRefreshedAt: '2026-05-11T10:00:00.000Z',
    artifacts: [
      {
        id: 'artifact-1',
        title: 'Launch memo',
        kind: 'document',
        description: null,
        displayName: null,
        sourceUrl: null,
        visibility: 'public',
        effectiveVisibility: 'public',
        issuedAt: null,
        expiresAt: null,
      },
    ],
    linkedSkills: [
      { id: 'skill-1', name: 'Product engineering', evidenceClasses: ['artifact_backed'] },
    ],
    isPublicSafe: true,
    ...overrides,
  };
}

function makeCompletionState() {
  return {
    stage: 'first_proof' as const,
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
      hasRequiredVerification: false,
    },
    counts: {
      contexts: 1,
      skills: 0,
      proofPacks: 0,
      anchoredProofPacks: 0,
      proofArtifacts: 0,
      acceptedVerifications: 0,
    },
    isCoreProfileComplete: true,
    isPortfolioReady: false,
    portfolioLockCode: 'proof' as const,
    portfolioLockReason: 'Add at least one anchored Proof Pack before your portfolio can be ready.',
  };
}

function renderProfileTabsSection(
  overrides: Partial<React.ComponentProps<typeof ProfileTabsSection>> = {}
) {
  return render(
    <ProfileTabsSection
      impactStories={[]}
      experiences={[]}
      education={[]}
      volunteering={[]}
      completionState={makeCompletionState()}
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
      onAddFirstProof={vi.fn()}
      onCompleteSafeShell={vi.fn()}
      {...overrides}
    />
  );
}

describe('profile launch IA', () => {
  afterEach(() => {
    startFromCvStatus.visible = false;
    startFromCvStatus.available = false;
    startFromCvStatus.blockers = [];
  });

  it('replaces legacy profile tabs with launch IA labels', () => {
    renderProfileTabsSection();

    expect(getTabTrigger('Context')).toBeInTheDocument();
    expect(getTabTrigger('Proof Packs')).toBeInTheDocument();
    expect(getTabTrigger('Verification')).toBeInTheDocument();
    expect(getTabTrigger('Visibility / Portfolio')).toBeInTheDocument();

    expect(queryTabTrigger(/journey/i)).toBeUndefined();
    expect(queryTabTrigger(/learning/i)).toBeUndefined();
    expect(queryTabTrigger(/service/i)).toBeUndefined();
    expect(queryTabTrigger(/proof stories/i)).toBeUndefined();
    expect(queryTabTrigger(/network/i)).toBeUndefined();
  });

  it('surfaces Start from CV from the approved profile scaffolding context when beta is available', () => {
    startFromCvStatus.visible = true;
    startFromCvStatus.available = true;

    renderProfileTabsSection();

    expect(screen.getAllByRole('button', { name: /Start from CV/i }).length).toBeGreaterThan(0);
  });

  it('shows proof-pack blockers and a direct add-proof path', () => {
    const onAddFirstProof = vi.fn();

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
            hasRequiredVerification: false,
          },
          counts: {
            contexts: 1,
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
        onAddFirstProof={onAddFirstProof}
        onCompleteSafeShell={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: /proof packs/i })).toBeInTheDocument();
    expect(screen.getByText(/readiness blockers/i)).toBeInTheDocument();
    expect(screen.getByText(/add your first proof link or artifact/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /add your first proof/i }));
    expect(onAddFirstProof).toHaveBeenCalledTimes(1);
  });

  it('renders Proof Packs as a sortable proof-first grid', () => {
    render(
      <ImpactTab
        impactStories={[]}
        proofPacks={[
          makeProofPack({
            id: 'older-private',
            title: 'Private archive proof',
            verificationStatus: 'unverified',
            verificationSummary: 'No scoped verification is recorded for this Proof Pack yet.',
            visibility: 'owner_only',
            proofQualityScore: 0.3,
            createdAt: '2026-04-01T10:00:00.000Z',
          }),
          makeProofPack({
            id: 'newer-public',
            title: 'Verified launch proof',
            verificationStatus: 'verified',
            visibility: 'public',
            proofQualityScore: 0.95,
            createdAt: '2026-05-12T10:00:00.000Z',
          }),
        ]}
        onAddStory={vi.fn()}
        onEditStory={vi.fn()}
        onDeleteStory={vi.fn()}
        actionsDisabled={false}
        completionState={{
          stage: 'publish_portfolio',
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
            hasFirstProof: true,
            hasStructuredProofPack: true,
            hasProofForPublishing: true,
            hasPublishedPortfolio: true,
            hasRequiredVerification: true,
          },
          counts: {
            contexts: 1,
            skills: 1,
            proofPacks: 2,
            anchoredProofPacks: 2,
            proofArtifacts: 2,
            acceptedVerifications: 1,
          },
          isCoreProfileComplete: true,
          isPortfolioReady: true,
          portfolioLockCode: null,
          portfolioLockReason: null,
        }}
        proofArtifactCount={2}
        acceptedVerificationCount={1}
        onAddFirstProof={vi.fn()}
        onCompleteSafeShell={vi.fn()}
      />
    );

    const cardsByNewest = screen.getAllByTestId('proof-pack-card');
    expect(cardsByNewest[0]).toHaveTextContent(/verified launch proof/i);
    expect(cardsByNewest[0]).toHaveTextContent(/launch memo/i);
    expect(cardsByNewest[0]).toHaveTextContent(/product engineering/i);
    expect(cardsByNewest[0]).toHaveTextContent(/public/i);
    expect(cardsByNewest[0]).toHaveTextContent(/verified/i);

    fireEvent.change(screen.getByLabelText(/sort/i), { target: { value: 'verification' } });

    const cardsByVerification = screen.getAllByTestId('proof-pack-card');
    expect(cardsByVerification[0]).toHaveTextContent(/verified launch proof/i);
    expect(cardsByVerification[1]).toHaveTextContent(/private archive proof/i);
  });

  it('prioritizes safe-shell completion before asking users to add more proof', () => {
    const onCompleteSafeShell = vi.fn();
    const onAddFirstProof = vi.fn();

    render(
      <ImpactTab
        impactStories={[]}
        onAddStory={vi.fn()}
        onEditStory={vi.fn()}
        onDeleteStory={vi.fn()}
        actionsDisabled={false}
        completionState={{
          stage: 'safe_shell',
          checks: {
            hasDisplayName: false,
            hasHandle: false,
            hasHeadlineOrBio: false,
            hasLocationOrTimezone: false,
            hasTargetRoleFocus: true,
            hasWorkPreference: true,
            hasEngagementPreference: true,
            hasLegacyShellCompatibility: false,
            hasSafeShell: false,
            hasRealContext: true,
            hasFirstProof: true,
            hasStructuredProofPack: true,
            hasProofForPublishing: true,
            hasPublishedPortfolio: false,
            hasRequiredVerification: true,
          },
          counts: {
            contexts: 1,
            skills: 0,
            proofPacks: 1,
            anchoredProofPacks: 1,
            proofArtifacts: 1,
            acceptedVerifications: 1,
          },
          isCoreProfileComplete: false,
          isPortfolioReady: false,
          portfolioLockCode: 'safe_shell',
          portfolioLockReason:
            'Finish your safe shell with the basics people need before they open your proof.',
        }}
        proofArtifactCount={1}
        acceptedVerificationCount={1}
        onAddFirstProof={onAddFirstProof}
        onCompleteSafeShell={onCompleteSafeShell}
      />
    );

    expect(
      screen.getByText(/complete your safe shell before publishing proof publicly/i)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /complete safe shell/i }));
    expect(onCompleteSafeShell).toHaveBeenCalledTimes(1);
    expect(onAddFirstProof).not.toHaveBeenCalled();
  });

  it('routes locked portfolio visibility users back to safe-shell completion', () => {
    const onCompleteSafeShell = vi.fn();

    render(
      <VisibilityPortfolioTab
        completionState={{
          stage: 'safe_shell',
          checks: {
            hasDisplayName: false,
            hasHandle: false,
            hasHeadlineOrBio: false,
            hasLocationOrTimezone: false,
            hasTargetRoleFocus: true,
            hasWorkPreference: true,
            hasEngagementPreference: true,
            hasLegacyShellCompatibility: false,
            hasSafeShell: false,
            hasRealContext: true,
            hasFirstProof: true,
            hasStructuredProofPack: true,
            hasProofForPublishing: true,
            hasPublishedPortfolio: false,
            hasRequiredVerification: true,
          },
          counts: {
            contexts: 1,
            skills: 0,
            proofPacks: 1,
            anchoredProofPacks: 1,
            proofArtifacts: 1,
            acceptedVerifications: 1,
          },
          isCoreProfileComplete: false,
          isPortfolioReady: false,
          portfolioLockCode: 'safe_shell',
          portfolioLockReason:
            'Finish your safe shell with the basics people need before they open your proof.',
        }}
        onCompleteSafeShell={onCompleteSafeShell}
      />
    );

    expect(screen.queryByRole('link', { name: /review portfolio visibility/i })).toBeNull();
    expect(screen.getByRole('link', { name: /export or delete/i })).toHaveAttribute(
      'href',
      '/app/i/settings/privacy#privacy-delete'
    );
    fireEvent.click(screen.getByRole('button', { name: /complete safe shell/i }));
    expect(onCompleteSafeShell).toHaveBeenCalledTimes(1);
  });
});
