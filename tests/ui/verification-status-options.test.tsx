import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { VerificationStatus } from '@/components/settings/VerificationStatus';

vi.mock('@/components/settings/WorkEmailVerificationForm', () => ({
  WorkEmailVerificationForm: () => <div>work-email-form</div>,
}));

describe('VerificationStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the three verification groups and keeps account signals separate from proof trust', async () => {
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
            scopedSignals: [],
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
      expect(screen.getByText(/Proof verifications \/ attestations/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Intro-readiness trust anchors/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Account-side checks/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Add work email/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Work email is the only launch-active account-side check/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/LinkedIn checks are outside the launch corridor/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/Government ID Verification/i)).not.toBeInTheDocument();
  });

  it('shows confirmed work email as an account-side check after verification is already complete', async () => {
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
            scopedSignals: [],
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
          /This account has a confirmed workplace email\. It can help with organization linking, but not with public trust or intro eligibility by itself\./i
        )
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Skipping verification is fine while getting portfolio-ready/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Run LinkedIn check/i })).not.toBeInTheDocument();
  });

  it('keeps older LinkedIn failures framed as archived account history', async () => {
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
            scopedSignals: [],
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
              state: 'failed',
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
        screen.getByText(/An older LinkedIn account-history check failed/i)
      ).toBeInTheDocument();
    });
    expect(document.body.textContent ?? '').not.toMatch(/compatibility check/i);
    expect(document.body.textContent ?? '').not.toMatch(/compatibility signal/i);
    expect(screen.queryByRole('button', { name: /Run LinkedIn check/i })).not.toBeInTheDocument();
  });
});
