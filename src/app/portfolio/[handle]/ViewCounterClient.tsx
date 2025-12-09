'use client';

import { useEffect, useState } from 'react';

export function ViewCounterClient({ handle, showCount }: { handle: string; showCount: boolean }) {
  const [count, setCount] = useState<number | null>(null);

  // Increment on mount for public view
  useEffect(() => {
    fetch(`/api/portfolio/view?handle=${encodeURIComponent(handle)}`, { method: 'POST' }).catch(
      () => {}
    );
  }, [handle]);

  // Fetch count for owner
  useEffect(() => {
    if (!showCount) return;
    const run = async () => {
      try {
        const res = await fetch(`/api/portfolio/view?handle=${encodeURIComponent(handle)}`);
        const data = await res.json();
        if (typeof data.count === 'number') setCount(data.count);
      } catch (e) {
        console.error(e);
      }
    };
    run();
  }, [handle, showCount]);

  if (!showCount) return null;

  return <span className="text-xs text-slate-600">Views: {count === null ? '…' : count}</span>;
}
