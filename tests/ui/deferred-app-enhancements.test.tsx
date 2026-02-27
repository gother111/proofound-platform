import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DeferredAppEnhancements } from '@/components/root/DeferredAppEnhancements';

const usePathnameMock = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
}));

vi.mock('@/components/support/ChatWidget', () => ({
  ChatWidget: () => <div data-testid="chat-widget">chat</div>,
}));

vi.mock('@/components/surveys/SUSPromptHost', () => ({
  SUSPromptHost: () => <div data-testid="sus-prompt-host">sus</div>,
}));

describe('DeferredAppEnhancements', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (window as any).requestIdleCallback = vi.fn();
    (window as any).cancelIdleCallback = vi.fn();
  });

  it('does not mount on non-app routes', () => {
    usePathnameMock.mockReturnValue('/about');

    render(<DeferredAppEnhancements />);

    expect(screen.queryByTestId('chat-widget')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sus-prompt-host')).not.toBeInTheDocument();
  });

  it('mounts on /app routes only after idle callback', async () => {
    usePathnameMock.mockReturnValue('/app/i/home');
    let idleCallback: IdleRequestCallback | null = null;
    (window as any).requestIdleCallback = vi.fn((cb: IdleRequestCallback) => {
      idleCallback = cb;
      return 1;
    });

    render(<DeferredAppEnhancements />);

    expect(screen.queryByTestId('chat-widget')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sus-prompt-host')).not.toBeInTheDocument();

    await waitFor(() => {
      expect((window as any).requestIdleCallback).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      idleCallback?.({ didTimeout: false, timeRemaining: () => 25 } as IdleDeadline);
    });

    await waitFor(() => {
      expect(screen.getByTestId('chat-widget')).toBeInTheDocument();
      expect(screen.getByTestId('sus-prompt-host')).toBeInTheDocument();
    });
  });

  it('skips snippet embed routes', () => {
    usePathnameMock.mockReturnValue('/p/demo/embed');

    render(<DeferredAppEnhancements />);

    expect(screen.queryByTestId('chat-widget')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sus-prompt-host')).not.toBeInTheDocument();
  });
});
