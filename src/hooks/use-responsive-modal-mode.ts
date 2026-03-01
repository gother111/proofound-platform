import { useEffect, useRef, useState } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';

const DEFAULT_BREAKPOINT_QUERY = '(min-width: 768px)';

function getCurrentMatch(query: string, fallback: boolean): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return fallback;
  }

  return window.matchMedia(query).matches;
}

/**
 * Locks responsive modal mode while a modal is open to prevent live Dialog/Drawer surface flips.
 */
export function useResponsiveModalMode(
  open: boolean,
  query: string = DEFAULT_BREAKPOINT_QUERY
): boolean {
  const liveMode = useMediaQuery(query);
  const [lockedMode, setLockedMode] = useState(() => getCurrentMatch(query, liveMode));
  const wasOpenRef = useRef(open);

  useEffect(() => {
    const openedNow = open && !wasOpenRef.current;

    if (openedNow) {
      setLockedMode(getCurrentMatch(query, liveMode));
    } else if (!open) {
      setLockedMode(liveMode);
    }

    wasOpenRef.current = open;
  }, [liveMode, open, query]);

  return open ? lockedMode : liveMode;
}

export { DEFAULT_BREAKPOINT_QUERY };
