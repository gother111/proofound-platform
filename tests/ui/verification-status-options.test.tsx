import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { VerificationStatus } from '@/components/settings/VerificationStatus';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

vi.mock('@/components/settings/WorkEmailVerificationForm', () => ({
  WorkEmailVerificationForm: () => <div>work-email-form</div>,
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: vi.fn(),
}));

const dispatchClientErrorDiagnosticMock = vi.mocked(dispatchClientErrorDiagnostic);

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
      expect(screen.getByText(/Proof verifications \/ confirmations/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Introduction readiness trusted confirmations/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Account-side checks/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Add work email/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Work email is the only launch-active account-side check/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/LinkedIn compatibility checks are outside the launch flow/i)
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

  it('keeps verification status load failures safe, diagnostic, and retryable', async () => {
    const rawFailure = 'database password leaked-ish';
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: rawFailure,
          details: 'hidden stack trace',
        }),
      })
      .mockResolvedValueOnce({
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
      });

    vi.stubGlobal('fetch', fetchMock);

    render(<VerificationStatus />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Verification status could not load');
    expect(alert).toHaveTextContent(
      'No verification, public trust, or intro-readiness state changed'
    );
    expect(document.body.textContent ?? '').not.toContain(rawFailure);
    expect(document.body.textContent ?? '').not.toContain('hidden stack trace');
    expect(document.body.textContent ?? '').not.toMatch(/browser console|F12/i);
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'settings.verification_status.load_failed',
      expect.any(Error)
    );
    expect((dispatchClientErrorDiagnosticMock.mock.calls[0]?.[1] as Error).message).toContain(
      rawFailure
    );

    fireEvent.click(screen.getByRole('button', { name: /retry verification status/i }));

    await waitFor(() => {
      expect(screen.getByText(/Proof verifications \/ confirmations/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Verification status could not load/i)).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
