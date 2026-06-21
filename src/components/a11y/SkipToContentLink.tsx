'use client';

import { useCallback } from 'react';

import {
  APP_MAIN_CONTENT_ID,
  FALLBACK_MAIN_CONTENT_ID,
  getAppMainSkipTarget,
  getMainContentSkipTarget,
} from '@/lib/a11y/skip-target';

function focusSkipTarget(target: HTMLElement) {
  target.focus?.({ preventScroll: true });
}

export function SkipToContentLink() {
  const handleClick = useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    const appMain = getAppMainSkipTarget();

    if (appMain) {
      event.preventDefault();
      requestAnimationFrame(() => {
        focusSkipTarget(appMain);
        history.replaceState(null, '', `#${APP_MAIN_CONTENT_ID}`);
      });
      return;
    }

    requestAnimationFrame(() => {
      const target = getMainContentSkipTarget();
      if (target) {
        focusSkipTarget(target);
      }
    });
  }, []);

  return (
    <a
      href={`#${FALLBACK_MAIN_CONTENT_ID}`}
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-proofound-forest focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-proofound-forest focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
}
