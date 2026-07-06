import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SkipToContentLink } from '@/components/a11y/SkipToContentLink';
import { APP_MAIN_CONTENT_ID, FALLBACK_MAIN_CONTENT_ID } from '@/lib/a11y/skip-target';

function AppMainFixture() {
  const mainRef = React.useRef<HTMLElement>(null);

  React.useLayoutEffect(() => {
    mainRef.current?.setAttribute('tabindex', '0');
  }, []);

  return (
    <main ref={mainRef} id={APP_MAIN_CONTENT_ID} data-app-main aria-label="Main content">
      Workspace content
    </main>
  );
}

describe('SkipToContentLink', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState(null, '', '/');
  });

  function mockAnimationFrame() {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 0;
    });
  }

  it('focuses the app shell main landmark when a root fallback target is also present', async () => {
    mockAnimationFrame();

    render(
      <>
        <SkipToContentLink />
        <div id={FALLBACK_MAIN_CONTENT_ID} tabIndex={-1}>
          <nav aria-label="Primary navigation">
            <a href="/app/i/home">Home</a>
          </nav>
          <AppMainFixture />
        </div>
      </>
    );

    fireEvent.click(screen.getByRole('link', { name: /skip to main content/i }));

    await waitFor(() => {
      const focused = document.activeElement;
      expect(focused).toBe(screen.getByRole('main', { name: /main content/i }));
      expect(focused).toHaveAttribute('data-app-main');
      expect(focused).toHaveAttribute('id', APP_MAIN_CONTENT_ID);
      expect(focused?.id).not.toBe(FALLBACK_MAIN_CONTENT_ID);
    });
    expect(window.location.hash).toBe(`#${APP_MAIN_CONTENT_ID}`);
  });

  it('keeps the public-page fallback target when no app shell main exists', async () => {
    mockAnimationFrame();

    render(
      <>
        <SkipToContentLink />
        <div id={FALLBACK_MAIN_CONTENT_ID} tabIndex={-1}>
          Public page content
        </div>
      </>
    );

    const fallback = document.getElementById(FALLBACK_MAIN_CONTENT_ID);
    fireEvent.click(screen.getByRole('link', { name: /skip to main content/i }));

    await waitFor(() => {
      expect(fallback).toHaveFocus();
    });
    expect(document.querySelector('main[data-app-main]')).toBeNull();
  });
});
