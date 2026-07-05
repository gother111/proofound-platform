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
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('renders individual day-1 success copy and supports publishing before copying', async () => {
    const onContinue = vi.fn();
    const onDecline = vi.fn();
    const onPublish = vi.fn().mockResolvedValue({ success: true });

    render(
      <PublicPortfolioReadyStep
        persona="individual"
        publicPortfolioUrl="https://proofound.io/portfolio/jane"
        onContinue={onContinue}
        onDecline={onDecline}
        onPublish={onPublish}
        previewTitle="Launch proof"
        previewDescription="Shows the first proof artifact."
      />
    );

    expect(screen.getByText(/your public page is ready/i)).toBeInTheDocument();
    expect(screen.getByText(/day 1 win unlocked/i)).toBeInTheDocument();
    expect(screen.getByText(/self-reported/i)).toBeInTheDocument();
    expect(screen.getByText(/verification upgrades the trust badge/i)).toBeInTheDocument();
    expect(screen.getByText('https://proofound.io/portfolio/jane')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy link/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /not now, go to home/i })).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('switch', { name: /publish my public page/i }));
      await Promise.resolve();
    });
    expect(onPublish).toHaveBeenCalledTimes(1);

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
    expect(onDecline).not.toHaveBeenCalled();
  });

  it('lets an unpublished individual decline without publishing', () => {
    const onContinue = vi.fn();
    const onDecline = vi.fn();
    const onPublish = vi.fn();

    render(
      <PublicPortfolioReadyStep
        persona="individual"
        publicPortfolioUrl="https://proofound.io/portfolio/jane"
        onContinue={onContinue}
        onDecline={onDecline}
        onPublish={onPublish}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /not now, go to home/i }));

    expect(onDecline).toHaveBeenCalledTimes(1);
    expect(onPublish).not.toHaveBeenCalled();
    expect(onContinue).not.toHaveBeenCalled();
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
    expect(screen.getByText(/publish by direct link, preview it, copy it/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /preview portfolio/i })).toHaveAttribute(
      'href',
      'https://proofound.io/portfolio/org/acme'
    );

    fireEvent.click(screen.getByRole('button', { name: /continue to app/i }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
