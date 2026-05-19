import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CookiePreferences } from '@/components/cookies/CookiePreferences';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/lib/error-handler', () => ({
  getUserErrorMessage: vi.fn((_error, fallback: string) => fallback),
  logError: vi.fn(),
}));

describe('CookiePreferences copy', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('uses product-quality language instead of broad platform or ad-targeting copy', () => {
    render(<CookiePreferences />);

    expect(screen.getByText(/Proofound is working/i)).toBeInTheDocument();
    expect(screen.getByText(/relevant Proofound updates/i)).toBeInTheDocument();
    expect(screen.queryByText(/use our platform/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Ad targeting/i)).not.toBeInTheDocument();
  });
});
