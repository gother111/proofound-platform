/**
 * Matching Preferences Page
 * /app/i/matching/preferences
 *
 * Implements PRD Gap 5: Dedicated page for matching profile editor
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MatchingPreferencesClient } from '@/components/matching/MatchingPreferencesClient';

export const metadata = {
  title: 'Matching Preferences | Proofound',
  description: 'Set your personal matching preferences',
};

export default async function MatchingPreferencesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold">Matching Preferences</h1>
        <p className="text-muted-foreground">
          Set your personal job preferences so we can match you with relevant opportunities.
        </p>
      </div>

      <MatchingPreferencesClient />
    </div>
  );
}
