import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CookieBanner } from '@/components/CookieBanner';
import { PREFERENCES_KEY } from '@/lib/cookies/consent';

const usePathnameMock = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
}));

vi.mock('@/lib/error-handler', () => ({
  logError: vi.fn(),
}));

describe('CookieBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    usePathnameMock.mockReturnValue('/app/i/home');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it.each([
    ['Accept All', true],
    ['Essential Only', false],
  ])(
    'hides immediately after %s even if consent sync is still pending',
    async (label, analytics) => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(
        () => new Promise<Response>(() => undefined)
      );

      render(<CookieBanner />);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByRole('heading', { name: /privacy choices/i })).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: label }));
        await Promise.resolve();
      });

      expect(screen.queryByRole('heading', { name: /privacy choices/i })).not.toBeInTheDocument();

      const storedPreferences = JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? '{}');
      expect(storedPreferences).toMatchObject({
        essential: true,
        analytics,
        marketing: false,
      });
    }
  );

  it('gives the compact close control a specific name and visible focus treatment', () => {
    render(<CookieBanner />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const close = screen.getByRole('button', { name: /close cookie preferences/i });
    expect(close).toHaveClass('focus-visible:ring-proofound-forest');
  });

  it('keeps legal and settings links finger-friendly when visible', () => {
    usePathnameMock.mockReturnValue('/login');

    render(<CookieBanner />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveClass('min-h-9');
    expect(screen.getByRole('link', { name: 'Cookie Policy' })).toHaveClass('min-h-9');
    expect(screen.getByRole('link', { name: 'Cookie Settings' })).toHaveClass('min-h-9');
  });

  it('does not render on snippet embed routes', () => {
    usePathnameMock.mockReturnValue('/p/demo/embed');

    render(<CookieBanner />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByRole('heading', { name: /privacy choices/i })).not.toBeInTheDocument();
  });
});
