import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/db';
import { orgInvitations, organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { CAPABILITY_TOKEN_CLASSES, inspectCapabilityToken } from '@/lib/security/capability-tokens';

export const dynamic = 'force-dynamic';

interface AcceptInvitePageProps {
  searchParams?: Promise<{ token?: string | string[] }>;
}

export default async function AcceptInvitePage({ searchParams }: AcceptInvitePageProps) {
  const params = (await searchParams) ?? {};
  const rawToken = Array.isArray(params.token) ? params.token[0] : params.token;
  const token = rawToken?.trim();

  if (!token) {
    return (
      <div className="min-h-screen bg-japandi-bg flex items-center justify-center p-6">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle>Invite link is invalid</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            This invite link is missing a token. Ask the organization to resend it.
          </CardContent>
        </Card>
      </div>
    );
  }

  const inspected = await inspectCapabilityToken(token, {
    tokenClass: CAPABILITY_TOKEN_CLASSES.ORG_MEMBER_INVITE,
    metadata: { surface: 'accept_invite_redirect' },
  });

  if (!inspected.ok || inspected.token.source_table !== 'org_invitations') {
    return (
      <div className="min-h-screen bg-japandi-bg flex items-center justify-center p-6">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle>Invite link is unavailable</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            The invite may be expired, revoked, or invalid.
          </CardContent>
        </Card>
      </div>
    );
  }

  const [invitation] = await db
    .select({
      orgSlug: organizations.slug,
    })
    .from(orgInvitations)
    .innerJoin(organizations, eq(organizations.id, orgInvitations.orgId))
    .where(eq(orgInvitations.id, inspected.token.source_id ?? ''))
    .limit(1);

  if (!invitation?.orgSlug) {
    return (
      <div className="min-h-screen bg-japandi-bg flex items-center justify-center p-6">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle>Invite link is unavailable</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            The invite may be expired, revoked, or invalid.
          </CardContent>
        </Card>
      </div>
    );
  }

  redirect(`/app/o/${invitation.orgSlug}/invitations/${token}`);
}
