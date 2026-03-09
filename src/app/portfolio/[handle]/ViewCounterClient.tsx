'use client';

import { useEffect } from 'react';

export function ViewCounterClient({
  subjectType,
  slugOrHandle,
}: {
  subjectType: 'individual_profile' | 'organization';
  slugOrHandle: string;
}) {
  useEffect(() => {
    const params = new URLSearchParams({
      subjectType,
      slugOrHandle,
    });
    fetch(`/api/portfolio/view?${params.toString()}`, { method: 'POST' }).catch(() => {});
  }, [slugOrHandle, subjectType]);

  return null;
}
