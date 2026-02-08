/**
 * Matching Preferences Page
 * /app/i/matching/preferences
 *
 * Implements PRD Gap 5: Dedicated page for matching profile editor
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MatchingPreferencesClient } from './preferences-client';

export const metadata = {
  title: 'Matching Preferences | Proofound',
  description: 'Customize your matching preferences',
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
    <div className="container max-w-4xl py-8">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold">Matching Preferences</h1>
        <p className="text-muted-foreground">
          Customize how we match you with opportunities. Adjust weights, set constraints, and
          control your visibility.
        </p>
      </div>

      <MatchingPreferencesClient />
    </div>
  );
}
