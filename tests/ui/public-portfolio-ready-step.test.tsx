import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicPortfolioReadyStep } from '@/components/onboarding/PublicPortfolioReadyStep';

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: vi.fn(),
}));

describe('PublicPortfolioReadyStep', () => {
  let clipboardWriteText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    clipboardWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: clipboardWriteText,
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders individual day-1 success copy and supports copying', async () => {
    const onContinue = vi.fn();

    render(
      <PublicPortfolioReadyStep
        persona="individual"
        publicPortfolioUrl="https://proofound.io/portfolio/jane"
        onContinue={onContinue}
      />
    );

    expect(screen.getByText(/your public page is live/i)).toBeInTheDocument();
    expect(screen.getByText(/day 1 proof link ready/i)).toBeInTheDocument();
    expect(screen.getByText(/search engines stay off until you opt in/i)).toBeInTheDocument();
    expect(screen.getByText('https://proofound.io/portfolio/jane')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy link/i }));
      await Promise.resolve();
    });
    expect(clipboardWriteText).toHaveBeenCalledWith('https://proofound.io/portfolio/jane');
    expect(screen.getByRole('status')).toHaveTextContent('Portfolio link copied.');
    act(() => {
      vi.runAllTimers();
    });

    fireEvent.click(screen.getByRole('button', { name: /continue to app/i }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('shows a recoverable inline copy failure', async () => {
    clipboardWriteText.mockRejectedValueOnce(new Error('Clipboard unavailable'));

    render(
      <PublicPortfolioReadyStep
        persona="individual"
        publicPortfolioUrl="https://proofound.io/portfolio/jane"
        onContinue={vi.fn()}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy link/i }));
      await Promise.resolve();
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Portfolio link could not be copied. Try again.'
    );
    expect(screen.getByRole('button', { name: /copy link/i })).toBeEnabled();
  });

  it('renders organization copy and continues to app', () => {
    const onContinue = vi.fn();

    render(
      <PublicPortfolioReadyStep
        persona="organization"
        publicPortfolioUrl="https://proofound.io/portfolio/org/acme"
        onContinue={onContinue}
      />
    );

    expect(screen.getByText(/organization portfolio is live/i)).toBeInTheDocument();
    expect(screen.getByText(/public organization link is shareable now/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /preview portfolio/i })).toHaveAttribute(
      'href',
      'https://proofound.io/portfolio/org/acme'
    );

    fireEvent.click(screen.getByRole('button', { name: /continue to app/i }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
