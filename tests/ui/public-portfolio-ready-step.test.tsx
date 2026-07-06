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
    expect(screen.getByText(/public page link ready/i)).toBeInTheDocument();
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
    expect(clipboardWriteText).toHaveBeenCalledWith('https://proofound.io/portfolio/jane');
    expect(screen.getByRole('status')).toHaveTextContent('Portfolio link copied.');
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

  it('shows a recoverable inline copy failure', async () => {
    clipboardWriteText.mockRejectedValueOnce(new Error('Clipboard unavailable'));

    render(
      <PublicPortfolioReadyStep
        persona="individual"
        publicPortfolioUrl="https://proofound.io/portfolio/jane"
        onContinue={vi.fn()}
        initiallyPublished
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy link/i }));
      await Promise.resolve();
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Portfolio link could not be copied. Select the link below or try again.'
    );
    const manualCopyInput = screen.getByLabelText('Portfolio link for manual copy');
    expect(manualCopyInput).toHaveValue('https://proofound.io/portfolio/jane');
    expect(manualCopyInput).toHaveClass('min-h-[44px]');
    expect(
      screen.queryByText('Portfolio link could not be copied. Try again.')
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy link/i })).toBeEnabled();
  });

  it('shows organization trust page manual-copy guidance when copying fails', async () => {
    clipboardWriteText.mockRejectedValueOnce(new Error('Clipboard unavailable'));

    render(
      <PublicPortfolioReadyStep
        persona="organization"
        publicPortfolioUrl="https://proofound.io/portfolio/org/acme"
        onContinue={vi.fn()}
        initiallyPublished
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy link/i }));
      await Promise.resolve();
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Organization trust page link could not be copied. Select the link below or try again.'
    );
    const manualCopyInput = screen.getByLabelText('Organization trust page link for manual copy');
    expect(manualCopyInput).toHaveValue('https://proofound.io/portfolio/org/acme');
    expect(manualCopyInput).toHaveClass('min-h-[44px]');
    expect(
      screen.queryByText('Organization trust page link could not be copied. Try again.')
    ).not.toBeInTheDocument();
  });

  it('renders organization trust page copy and continues to app', () => {
    const onContinue = vi.fn();

    render(
      <PublicPortfolioReadyStep
        persona="organization"
        publicPortfolioUrl="https://proofound.io/portfolio/org/acme"
        onContinue={onContinue}
      />
    );

    expect(screen.getByText(/organization trust page is live/i)).toBeInTheDocument();
    expect(screen.getByText(/publish by direct link, preview it, copy it/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /preview portfolio/i })).toHaveAttribute(
      'href',
      'https://proofound.io/portfolio/org/acme'
    );
    expect(document.body.textContent ?? '').not.toMatch(/organization portfolio/i);

    fireEvent.click(screen.getByRole('button', { name: /continue to app/i }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
