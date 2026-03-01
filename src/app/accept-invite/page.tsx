import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/db';
import { orgInvitations, organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

  const [invitation] = await db
    .select({
      token: orgInvitations.token,
      orgSlug: organizations.slug,
    })
    .from(orgInvitations)
    .innerJoin(organizations, eq(organizations.id, orgInvitations.orgId))
    .where(eq(orgInvitations.token, token))
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

  redirect(`/app/o/${invitation.orgSlug}/invitations/${invitation.token}`);
}
