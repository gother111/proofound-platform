import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PortfolioWorkspaceClient } from '@/app/app/i/portfolio/PortfolioWorkspaceClient';

const refreshMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: refreshMock,
  }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/components/ui/v2/AppSurface', () => ({
  AppSurface: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/settings/PortfolioVisibilityCard', () => ({
  PortfolioVisibilityCard: () => <div data-testid="portfolio-visibility-card" />,
}));

vi.mock('@/app/portfolio/[handle]/ShareLinkButton', () => ({
  ShareLinkButton: ({ url }: any) => <button>copy {url}</button>,
}));

vi.mock('@/app/portfolio/[handle]/CopyTextButton', () => ({
  CopyTextButton: () => <button>Copy recruiter summary</button>,
}));

vi.mock('@/app/portfolio/[handle]/DownloadPdfButton', () => ({
  DownloadPdfButton: () => <button>Download trust PDF</button>,
}));

vi.mock('@/app/app/i/expertise/components/AddSkillDrawer', () => ({
  AddSkillDrawer: ({ open, onSkillAdded }: any) =>
    open ? (
      <div data-testid="add-skill-drawer">
        <button onClick={onSkillAdded}>mock-skill-added</button>
      </div>
    ) : null,
}));

describe('PortfolioWorkspaceClient', () => {
  it('renders a real portfolio management surface with visibility and share actions', () => {
    render(
      <PortfolioWorkspaceClient
        readiness={{
          readinessScore: 80,
          scoreBreakdown: [],
          topActions: [
            {
              id: 'strengthen-proof',
              title: 'Strengthen proof packs',
              description: 'Keep proof current and relevant.',
              priority: 'high',
              category: 'profile',
              actionUrl: '/app/i/portfolio',
            },
          ],
          states: ['portfolio_ready', 'browse_ready'],
          highestState: 'browse_ready',
          publicPortfolioUrl: 'https://proofound.io/portfolio/jane',
          missingByState: {
            portfolio_ready: [],
            browse_ready: [],
            qualified_intro_ready: [
              {
                id: 'trusted_signal',
                label: 'Non-self trust anchor',
                detail: 'Add one active non-self trust signal.',
                met: false,
                actionUrl: '/app/i/verifications',
              },
            ],
          },
          legacyTier: 'lite',
          flags: {
            portfolioReady: true,
            browseReady: true,
            qualifiedIntroReady: false,
            discoverable: true,
            matchVisible: true,
            introEligible: false,
            stronglyTrusted: false,
          },
          proofProgress: {
            totalProofs: 2,
            verifiedProofs: 1,
            pendingVerificationRequests: 0,
            completionRate: 50,
            nextStep: 'Add one more proof-backed signal',
          },
          skillToOpportunityBridge: [],
          marketActivityLow: false,
          metrics: {
            totalMatches: 0,
            highQualityMatches: 0,
            pendingVerifications: 1,
            skillsCount: 3,
            proofBackedSkillCount: 2,
            roleRelevantProofLinkedL4Count: 2,
            freshProofLinkedL4Count12: 0,
          },
        }}
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
            hasOptionalVerification: false,
          },
          counts: {
            contexts: 1,
            values: 0,
            causes: 0,
            skills: 3,
            proofPacks: 2,
            anchoredProofPacks: 1,
            proofArtifacts: 2,
            acceptedVerifications: 0,
          },
          isCoreProfileComplete: true,
          isPortfolioReady: true,
          portfolioLockCode: null,
          portfolioLockReason: null,
        }}
      />
    );

    expect(screen.getByRole('heading', { name: /portfolio workspace/i })).toBeInTheDocument();
    expect(screen.getByText('Match visible')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Proof Packs' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Verification' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Visibility / Portfolio' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /preview public portfolio/i })).toHaveAttribute(
      'href',
      'https://proofound.io/portfolio/jane'
    );
    expect(screen.getByTestId('portfolio-visibility-card')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy recruiter summary/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download trust pdf/i })).toBeInTheDocument();
  });

  it('keeps add your first proof as the dominant action when no proof exists', () => {
    render(
      <PortfolioWorkspaceClient
        readiness={{
          readinessScore: 10,
          scoreBreakdown: [],
          topActions: [
            {
              id: 'add-first-proof',
              title: 'Add your first proof',
              description: 'Start with one real proof link or artifact.',
              priority: 'high',
              category: 'profile',
              actionUrl: '/app/i/portfolio',
            },
          ],
          states: [],
          highestState: null,
          publicPortfolioUrl: null,
          missingByState: {
            portfolio_ready: [
              {
                id: 'anchored_proof_pack',
                label: 'Anchored Proof Pack',
                detail: 'Add one anchored Proof Pack.',
                met: false,
                actionUrl: '/app/i/portfolio',
              },
            ],
            browse_ready: [],
            qualified_intro_ready: [],
          },
          legacyTier: 'none',
          flags: {
            portfolioReady: false,
            browseReady: false,
            qualifiedIntroReady: false,
            discoverable: false,
            matchVisible: false,
            introEligible: false,
            stronglyTrusted: false,
          },
          proofProgress: {
            totalProofs: 0,
            verifiedProofs: 0,
            pendingVerificationRequests: 0,
            completionRate: 0,
            nextStep: 'Add your first proof',
          },
          skillToOpportunityBridge: [],
          marketActivityLow: false,
          metrics: {
            totalMatches: 0,
            highQualityMatches: 0,
            pendingVerifications: 0,
            skillsCount: 0,
          },
        }}
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
      />
    );

    fireEvent.click(screen.getAllByRole('button', { name: /add your first proof/i })[0]);

    expect(screen.getByTestId('add-skill-drawer')).toBeInTheDocument();
  });
});
