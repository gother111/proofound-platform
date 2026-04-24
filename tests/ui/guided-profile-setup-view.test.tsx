import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { GuidedProfileSetupView } from '@/components/profile/GuidedProfileSetupView';

describe('GuidedProfileSetupView', () => {
  it('makes add your first proof the dominant CTA and shows the locked proof-first order', () => {
    render(
      <GuidedProfileSetupView
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
            hasRequiredVerification: false,
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
          portfolioLockReason: 'Add your first proof.',
        }}
        onEditProfile={vi.fn()}
        onOpenFullProfile={vi.fn()}
        onAddExperience={vi.fn()}
        onAddEducation={vi.fn()}
        onAddVolunteering={vi.fn()}
        onOpenProofs={vi.fn()}
        onOpenVerification={vi.fn()}
        onOpenPortfolio={vi.fn()}
        onOpenMatchingPreferences={vi.fn()}
      />
    );

    expect(
      screen.getByRole('heading', { name: /start with proof, not profile polish/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId('guided-dominant-proof-cta')).toBeInTheDocument();
    expect(screen.queryByText(/complete your profile/i)).not.toBeInTheDocument();

    const labels = [
      'Create a safe shell',
      'Add one real context',
      'Add your first proof',
      'Structure your first Proof Pack',
      'Required verification',
      'Publish portfolio',
    ];

    labels.forEach((label) => {
      expect(screen.queryAllByText(label).length).toBeGreaterThan(0);
    });
  });
});
