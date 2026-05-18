import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { VerifyWorkEmailContent } from '@/app/verify-work-email/VerifyWorkEmailContent';
import { VISUAL_VERIFY_TOKENS } from '@/lib/verification/visual-link-fixtures';

const routerPush = vi.fn();
const searchParamsGet = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: routerPush,
  }),
  useSearchParams: () => ({
    get: searchParamsGet,
  }),
}));

describe('VerifyWorkEmailContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsGet.mockReturnValue(null);
    vi.stubGlobal('fetch', vi.fn());
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_SUPABASE', 'true');
  });

  it('gives missing-token users clear recovery actions', async () => {
    render(<VerifyWorkEmailContent />);

    await waitFor(() => {
      expect(screen.getByText('Verification failed')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Request a fresh work-email link from settings.', { exact: false })
    ).toBeInTheDocument();
    expect(screen.getByText(/Verification token is missing/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /open work-email settings/i }));
    expect(routerPush).toHaveBeenCalledWith('/app/i/settings');

    fireEvent.click(screen.getByRole('button', { name: /return to profile/i }));
    expect(routerPush).toHaveBeenCalledWith('/app/i/profile');
  });

  it('renders the local visual success state without calling the verification API', async () => {
    searchParamsGet.mockImplementation((key: string) =>
      key === 'token' ? VISUAL_VERIFY_TOKENS.workEmailSuccess : null
    );

    render(<VerifyWorkEmailContent />);

    await waitFor(() => {
      expect(screen.getByText('Work email verified')).toBeInTheDocument();
    });

    expect(screen.getByText('elena.reviewer@northstar-evidence.example')).toBeInTheDocument();
    expect(screen.getByText(/Your workplace signal is now active/i)).toBeInTheDocument();
    expect(screen.getByText('You can return to your profile when ready.')).toBeInTheDocument();
    expect(screen.queryByText(/Redirecting to your profile/i)).not.toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /go to profile now/i }));
    expect(routerPush).toHaveBeenCalledWith('/app/i/profile');
  });
});
