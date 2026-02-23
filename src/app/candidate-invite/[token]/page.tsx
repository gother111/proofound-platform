import { CandidateInviteClient } from './CandidateInviteClient';

export const dynamic = 'force-dynamic';

export default async function CandidateInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <CandidateInviteClient token={token} />;
}
