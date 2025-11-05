'use client';

import { useRouter } from 'next/navigation';
import { CookiePreferences } from './CookiePreferences';

export function CookieSettingsClient({ returnTo }: { returnTo: string }) {
  const router = useRouter();

  const handleSave = () => {
    router.push(returnTo);
  };

  return <CookiePreferences onSave={handleSave} />;
}
