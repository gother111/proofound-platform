'use client';

import { useCallback } from 'react';

const MAIN_CONTENT_ID = 'main-content';

function focusMainContent() {
  const el = document.getElementById(MAIN_CONTENT_ID);
  if (!el) return;

  // Ensure the target can receive programmatic focus.
  (el as HTMLElement).focus?.({ preventScroll: true });
}

export function SkipToContentLink() {
  const handleClick = useCallback(() => {
    // Allow the hash navigation to apply first, then move focus.
    requestAnimationFrame(() => focusMainContent());
  }, []);

  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-proofound-forest focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-proofound-forest focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
}
