import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { useResponsiveModalMode } from '@/hooks/use-responsive-modal-mode';

type MatchMediaListener = (event: MediaQueryListEvent) => void;

let mediaMatches = false;
const mediaListeners = new Set<MatchMediaListener>();

function installMatchMediaMock() {
  mediaListeners.clear();

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: mediaMatches,
      media: query,
      onchange: null,
      addEventListener: (_: 'change', listener: MatchMediaListener) => {
        mediaListeners.add(listener);
      },
      removeEventListener: (_: 'change', listener: MatchMediaListener) => {
        mediaListeners.delete(listener);
      },
      addListener: (listener: MatchMediaListener) => {
        mediaListeners.add(listener);
      },
      removeListener: (listener: MatchMediaListener) => {
        mediaListeners.delete(listener);
      },
      dispatchEvent: vi.fn(),
    })),
  });
}

function setMediaMatches(next: boolean) {
  mediaMatches = next;
  const event = { matches: next, media: '(min-width: 768px)' } as MediaQueryListEvent;
  mediaListeners.forEach((listener) => listener(event));
}

function HookHarness({ open }: { open: boolean }) {
  const isDesktop = useResponsiveModalMode(open);
  return <div data-testid="mode">{isDesktop ? 'desktop' : 'mobile'}</div>;
}

describe('useResponsiveModalMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mediaMatches = false;
    installMatchMediaMock();
  });

  it('tracks live media state when closed, locks state while open, and re-syncs after close', async () => {
    const { rerender } = render(<HookHarness open={false} />);

    expect(screen.getByTestId('mode')).toHaveTextContent('mobile');

    act(() => {
      setMediaMatches(true);
    });

    await waitFor(() => {
      expect(screen.getByTestId('mode')).toHaveTextContent('desktop');
    });

    rerender(<HookHarness open={true} />);
    expect(screen.getByTestId('mode')).toHaveTextContent('desktop');

    act(() => {
      setMediaMatches(false);
    });

    expect(screen.getByTestId('mode')).toHaveTextContent('desktop');

    rerender(<HookHarness open={false} />);

    await waitFor(() => {
      expect(screen.getByTestId('mode')).toHaveTextContent('mobile');
    });
  });

  it('locks from current matchMedia value when opened immediately', async () => {
    mediaMatches = true;
    installMatchMediaMock();

    const { rerender } = render(<HookHarness open={true} />);

    await waitFor(() => {
      expect(screen.getByTestId('mode')).toHaveTextContent('desktop');
    });

    act(() => {
      setMediaMatches(false);
    });

    expect(screen.getByTestId('mode')).toHaveTextContent('desktop');

    rerender(<HookHarness open={false} />);

    await waitFor(() => {
      expect(screen.getByTestId('mode')).toHaveTextContent('mobile');
    });
  });
});
