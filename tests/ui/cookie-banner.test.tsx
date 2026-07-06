import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CookieBanner } from '@/components/CookieBanner';
import * as cookieConsent from '@/lib/cookies/consent';
import { PREFERENCES_KEY } from '@/lib/cookies/consent';

const usePathnameMock = vi.fn();
const dispatchClientErrorDiagnosticMock = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: (...args: unknown[]) => dispatchClientErrorDiagnosticMock(...args),
}));

describe('CookieBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
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
    expect(close).toHaveClass('h-11');
    expect(close).toHaveClass('w-11');
  });

  it('keeps compact app-route cookie actions finger-friendly', () => {
    usePathnameMock.mockReturnValue('/app/i/settings/privacy');

    render(<CookieBanner />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByRole('button', { name: 'Accept All' })).toHaveClass('h-11');
    expect(screen.getByRole('button', { name: 'Accept All' })).toHaveClass('min-h-[44px]');
    expect(screen.getByRole('button', { name: 'Essential Only' })).toHaveClass('h-11');
    expect(screen.getByRole('button', { name: 'Essential Only' })).toHaveClass('min-h-[44px]');
  });

  it('keeps legal and settings links finger-friendly when visible', () => {
    usePathnameMock.mockReturnValue('/login');

    render(<CookieBanner />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveClass('min-h-[44px]');
    expect(screen.getByRole('link', { name: 'Cookie Policy' })).toHaveClass('min-h-[44px]');
    expect(screen.getByRole('link', { name: 'Cookie Settings' })).toHaveClass('min-h-[44px]');
  });

  it('docks first-visit consent on public pages so proof content stays inspectable', () => {
    usePathnameMock.mockReturnValue('/portfolio/demo-proofound');

    render(<CookieBanner />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const bannerCard = screen
      .getByRole('heading', { name: /privacy choices/i })
      .closest('.pointer-events-auto');

    expect(bannerCard).toHaveClass('max-w-xl');
    expect(bannerCard).toHaveClass('sm:ml-auto');
    expect(bannerCard).toHaveClass('sm:mr-4');
  });

  it('uses concise first-visit consent copy inside app workflows', () => {
    usePathnameMock.mockReturnValue('/app/o/test-org/assignments');

    render(<CookieBanner />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(
      screen.getByText(
        'Essential cookies keep Proofound working. Optional analytics stay off unless you accept.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/We never sell your data/i)).not.toBeInTheDocument();
  });

  it('does not render on snippet embed routes', () => {
    usePathnameMock.mockReturnValue('/p/demo/embed');

    render(<CookieBanner />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByRole('heading', { name: /privacy choices/i })).not.toBeInTheDocument();
  });

  it('keeps failed first-visit cookie choices visible, safe, and retryable', async () => {
    const rawFailure = new Error('localStorage cookie quota leaked-ish');
    vi.spyOn(cookieConsent, 'saveCookiePreferences').mockRejectedValueOnce(rawFailure);

    render(<CookieBanner />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Accept All' }));
      await Promise.resolve();
    });

    expect(screen.getByRole('heading', { name: /privacy choices/i })).toBeInTheDocument();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Cookie choice could not be saved');
    expect(alert).toHaveTextContent('Your choice was not recorded');
    expect(document.body.textContent ?? '').not.toContain(rawFailure.message);
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'cookies.banner.save_failed',
      rawFailure
    );
    expect(screen.getByRole('button', { name: 'Accept All' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Essential Only' })).toBeEnabled();
    expect(localStorage.getItem(PREFERENCES_KEY)).toBeNull();
  });
});
