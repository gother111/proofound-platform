import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { VerifyWorkEmailContent } from '@/app/verify-work-email/VerifyWorkEmailContent';

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
});
