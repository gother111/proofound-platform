'use client';

import { useEffect, useState } from 'react';

/**
 * Lightweight background that avoids SVG animation errors in Edge/SSR.
 * Replaces the old motion-based network with soft gradients and blurs.
 */
export function NetworkBackground() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#F2F0EA] via-white to-[#DCE7DE]" />
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-proofound-forest/10 blur-3xl animate-pulse" />
      <div className="absolute -right-24 top-10 h-[28rem] w-[28rem] rounded-full bg-[#C67B5C]/10 blur-3xl animate-pulse [animation-delay:400ms]" />
      <div className="absolute left-1/3 bottom-0 h-[30rem] w-[30rem] rounded-full bg-[#5C8B89]/10 blur-3xl animate-pulse [animation-delay:800ms]" />
      <div className="absolute inset-0 opacity-40">
        <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(122,146,120,0.18),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(198,123,92,0.16),transparent_32%),radial-gradient(circle_at_50%_70%,rgba(92,139,137,0.14),transparent_38%)]" />
      </div>
    </div>
  );
}
