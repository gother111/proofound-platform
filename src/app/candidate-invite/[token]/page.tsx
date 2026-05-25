import { CandidateInviteClient } from './CandidateInviteClient';
import {
  buildVisualCandidateInviteResponse,
  candidateInviteVisualFixturesEnabled,
} from '@/lib/candidate-invites/visual-fixtures';

export const dynamic = 'force-dynamic';

export default async function CandidateInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (candidateInviteVisualFixturesEnabled()) {
    const visualInvite = buildVisualCandidateInviteResponse(token);
    if (visualInvite) {
      return (
        <CandidateInviteClient
          token={token}
          initialState={{
            ...visualInvite,
            currentUser: visualInvite.invite.claimedByCurrentUser
              ? {
                  id: '00000000-0000-4000-8000-000000000001',
                  email: 'admin@test-org.com',
                }
              : null,
          }}
          visualMode
        />
      );
    }
  }

  return <CandidateInviteClient token={token} />;
}
