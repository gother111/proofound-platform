import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Mail } from 'lucide-react';
import { CAPABILITY_TOKEN_CLASSES, inspectCapabilityToken } from '@/lib/security/capability-tokens';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { acceptInvitation } from '@/actions/org';
import { AppSurface } from '@/components/ui/v2/AppSurface';

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

  const user = await requireAuth();
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const inspected = await inspectCapabilityToken(token, {
    tokenClass: CAPABILITY_TOKEN_CLASSES.ORG_MEMBER_INVITE,
    actor: {
      email: authUser?.email ?? null,
      profileId: user.id,
      principalType: 'user_account',
    },
    metadata: { surface: 'accept_invite_page' },
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

  const invitationRecord = await adminClient
    .from('org_invitations')
    .select(
      `
        id,
        org_id,
        email,
        role,
        expires_at,
        org:organizations (
          id,
          slug,
          displayName:display_name,
          mission
        )
      `
    )
    .eq('id', inspected.token.source_id)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (invitationRecord.error || !invitationRecord.data) {
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

  const invitationData = invitationRecord.data;
  const orgInfo = Array.isArray(invitationData.org) ? invitationData.org[0] : invitationData.org;

  if (!orgInfo?.slug) {
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

  const { data: existingMembership } = await adminClient
    .from('organization_members')
    .select('user_id')
    .eq('org_id', invitationData.org_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingMembership) {
    redirect(`/app/o/${orgInfo.slug}/home`);
  }

  return (
    <AppSurface>
      <div className="flex items-center justify-center px-4 w-full h-[calc(100vh-8rem)]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-primary-500" />
            </div>
            <CardTitle>You&apos;re invited!</CardTitle>
            <CardDescription>You&apos;ve been invited to join an organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4 p-4 bg-primary-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-neutral-dark-700">{orgInfo?.displayName}</p>
                {orgInfo?.mission && (
                  <p className="text-sm text-neutral-dark-600 mt-1 line-clamp-2">
                    {orgInfo.mission}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-dark-600">Your role:</span>
                <span className="font-medium text-neutral-dark-700 capitalize">
                  {invitationData.role}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-dark-600">Invited to:</span>
                <span className="font-medium text-neutral-dark-700">{invitationData.email}</span>
              </div>
            </div>

            <form
              action={async () => {
                'use server';
                const result = await acceptInvitation(token);
                if (result.success && result.orgSlug) {
                  redirect(`/app/o/${result.orgSlug}/home`);
                }
              }}
              className="space-y-4"
            >
              <Button type="submit" className="w-full" size="lg">
                Accept Invitation
              </Button>
              <p className="text-xs text-center text-neutral-dark-500">
                By accepting, you&apos;ll become a member of this organization
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppSurface>
  );
}
