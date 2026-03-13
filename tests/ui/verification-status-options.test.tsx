import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { VerificationStatus } from '@/components/settings/VerificationStatus';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/settings/WorkEmailVerificationForm', () => ({
  WorkEmailVerificationForm: () => <div>work-email-form</div>,
}));

vi.mock('@/components/settings/LinkedInVerification', () => ({
  LinkedInVerification: () => <div>linkedin-verification-form</div>,
}));

describe('VerificationStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows work email and LinkedIn options but hides Government ID option', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          summary: {
            badgeSemanticsVersion: 2,
            publicBadges: [],
            orgReviewBadges: [],
            internalBadges: [],
            slots: {
              identity: { state: 'none' },
              workplace: { state: 'none' },
              organizationDomain: { state: 'none' },
              organizationPlatformReview: { state: 'none' },
            },
            activeIssues: [],
          },
          workflow: null,
          channels: {
            workEmail: {
              email: null,
              state: 'unverified',
              verifiedAt: null,
              reverifyDueAt: null,
              needsReverify: false,
            },
            linkedin: {
              state: 'unverified',
              signalLevel: 'none',
              verifiedAt: null,
              hasIdentitySignal: false,
            },
          },
        }),
      })
    );

    render(<VerificationStatus />);

    await waitFor(() => {
      expect(screen.getByText(/Verify with Work Email/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Verify with LinkedIn/i)).toBeInTheDocument();
    expect(screen.queryByText(/Government ID Verification/i)).not.toBeInTheDocument();
  });

  it('shows confirmed work email as a compatibility signal after verification is already complete', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          summary: {
            badgeSemanticsVersion: 2,
            publicBadges: [],
            orgReviewBadges: [],
            internalBadges: [],
            slots: {
              identity: { state: 'none' },
              workplace: { state: 'verified' },
              organizationDomain: { state: 'none' },
              organizationPlatformReview: { state: 'none' },
            },
            activeIssues: [],
          },
          workflow: {
            state: 'verified',
            displayState: 'Verified',
            reasonCode: null,
            timestamps: {},
            allowedActions: [],
          },
          channels: {
            workEmail: {
              email: 'person@acme.org',
              state: 'verified',
              verifiedAt: null,
              reverifyDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              needsReverify: false,
            },
            linkedin: {
              state: 'unverified',
              signalLevel: 'none',
              verifiedAt: null,
              hasIdentitySignal: false,
            },
          },
        }),
      })
    );

    render(<VerificationStatus />);

    await waitFor(() => {
      expect(
        screen.getByText(
          /The account has a workplace-linked compatibility signal\. It does not create a public trust badge or matching lift on its own\./i
        )
      ).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Check LinkedIn Again/i })).toBeInTheDocument();
  });
});
