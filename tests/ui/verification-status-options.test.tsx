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
          verified: false,
          verificationMethod: null,
          verificationStatus: 'unverified',
          verifiedAt: null,
          workEmail: null,
          workEmailVerified: false,
          workEmailReverifyDueAt: null,
          workEmailNeedsReverify: false,
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

  it('offers LinkedIn verification after work email verification is already complete', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          verified: true,
          verificationMethod: 'work_email',
          verificationStatus: 'verified',
          verifiedAt: new Date().toISOString(),
          workEmail: 'person@acme.org',
          workEmailVerified: true,
          workEmailReverifyDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          workEmailNeedsReverify: false,
        }),
      })
    );

    render(<VerificationStatus />);

    await waitFor(() => {
      expect(screen.getByText(/Identity Verified/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Add LinkedIn Verification/i })).toBeInTheDocument();
  });
});
