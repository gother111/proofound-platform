import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { normalizeEmail } from '@/lib/verification/integrity';
import { loadVerificationRequestFeed } from '@/lib/verification/request-feed';
import { DeferredVerificationsClient } from './DeferredVerificationsClient';

export const dynamic = 'force-dynamic';

export default async function VerificationsPage() {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data: authUser } = await supabase.auth.getUser();
  const userEmail = normalizeEmail(authUser.user?.email || null) || '';
  const hasVerifiedEmail = Boolean(authUser.user?.email_confirmed_at);

  const { incomingRequests, sentRequests, composerProofPacks } = await loadVerificationRequestFeed({
    userId: user.id,
    userEmail,
    hasVerifiedEmail,
    supabase,
  });

  return (
    <DeferredVerificationsClient
      incomingRequests={incomingRequests}
      sentRequests={sentRequests}
      composerProofPacks={composerProofPacks}
      userEmail={userEmail}
    />
  );
}
