import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import VerifyCustomRequestPage from '@/app/verify/custom/[token]/page';
import VerifySkillPage from '@/app/verify/[token]/page';
import { apiFetch } from '@/lib/api/fetch';
import { VISUAL_VERIFY_TOKENS } from '@/lib/verification/visual-link-fixtures';

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: vi.fn(),
}));

const routerPush = vi.fn();
let routeParams: Record<string, string> = {};

vi.mock('next/navigation', () => ({
  useParams: () => routeParams,
  useRouter: () => ({
    push: routerPush,
  }),
}));

const apiFetchMock = vi.mocked(apiFetch);

describe('verification link visual fixtures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeParams = {};
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_SUPABASE', 'true');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('renders the filled skill-observed verifier state without calling the guarded public API', async () => {
    routeParams = { token: VISUAL_VERIFY_TOKENS.skillObserved };

    render(<VerifySkillPage />);

    await waitFor(() => {
      expect(
        screen.getAllByText(/Evidence operations and privacy-safe proof review/i).length
      ).toBeGreaterThan(0);
    });

    expect(screen.getByText(/Privacy-safe proof review checklist/i)).toBeInTheDocument();
    expect(screen.getByText(/Record bounded observations/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /No/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Partly/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Yes/i })).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Partly/i }));

    await waitFor(() => {
      expect(screen.getByText(/Partial Response Recorded/i)).toBeInTheDocument();
    });
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('renders the filled custom verifier bundle and records a local visual response', async () => {
    routeParams = { token: VISUAL_VERIFY_TOKENS.customBundle };

    render(<VerifyCustomRequestPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/Elena Proof Reviewer/i).length).toBeGreaterThan(0);
    });

    expect(
      screen.getByText(
        /Led a privacy-safe evidence review workflow for a high-trust pilot corridor/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The redesign made the review packet easier to inspect/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Decline/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Verify Artifacts/i })).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Verify Artifacts/i }));

    await waitFor(() => {
      expect(screen.getByText(/Thank You/i)).toBeInTheDocument();
    });
    expect(apiFetchMock).not.toHaveBeenCalled();
  });
});
