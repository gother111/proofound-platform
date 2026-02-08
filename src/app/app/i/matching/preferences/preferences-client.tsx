'use client';

import { useRouter } from 'next/navigation';
import { MatchingProfileSetup } from '@/components/matching/MatchingProfileSetup';

export function MatchingPreferencesClient() {
  const router = useRouter();

  return (
    <MatchingProfileSetup
      onComplete={() => {
        router.push('/app/i/matching');
      }}
      onCancel={() => {
        router.push('/app/i/matching');
      }}
    />
  );
}
