import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicPortfolioReadyStep } from '@/components/onboarding/PublicPortfolioReadyStep';

describe('PublicPortfolioReadyStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
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

    expect(screen.getByText(/your public portfolio is live/i)).toBeInTheDocument();
    expect(screen.getByText(/day 1 win unlocked/i)).toBeInTheDocument();
    expect(screen.getByText('https://proofound.io/portfolio/jane')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy link/i }));
      await Promise.resolve();
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://proofound.io/portfolio/jane'
    );
    act(() => {
      vi.runAllTimers();
    });

    fireEvent.click(screen.getByRole('button', { name: /continue to app/i }));
    expect(onContinue).toHaveBeenCalledTimes(1);
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
    expect(screen.getByText(/team, partners, and candidates/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view portfolio/i })).toHaveAttribute(
      'href',
      'https://proofound.io/portfolio/org/acme'
    );

    fireEvent.click(screen.getByRole('button', { name: /continue to app/i }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
