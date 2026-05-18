import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Mail } from 'lucide-react';
import { CAPABILITY_TOKEN_CLASSES, inspectCapabilityToken } from '@/lib/security/capability-tokens';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { acceptInvitation } from '@/actions/org';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { AcceptInviteVisualClient } from './AcceptInviteVisualClient';
import {
  buildVisualOrgInvite,
  orgInviteVisualFixturesEnabled,
} from '@/lib/org-invites/visual-fixtures';

export const dynamic = 'force-dynamic';

interface AcceptInvitePageProps {
  searchParams?: Promise<{ token?: string | string[] }>;
}

function InviteUnavailableCard({
  title = 'Invite link is unavailable',
  message = 'The invite may be expired, revoked, or invalid.',
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-japandi-bg p-6">
      <Card className="w-full max-w-lg rounded-[24px] border-proofound-stone bg-white/90 shadow-[0_4px_24px_rgba(29,51,48,0.08)]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-proofound-forest/10">
            <Mail className="h-5 w-5 text-proofound-forest" />
          </div>
          <CardTitle className="font-display text-2xl text-proofound-charcoal">{title}</CardTitle>
          <CardDescription className="leading-6 text-proofound-charcoal/70">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Return home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function AcceptInvitePage({ searchParams }: AcceptInvitePageProps) {
  const params = (await searchParams) ?? {};
  const rawToken = Array.isArray(params.token) ? params.token[0] : params.token;
  const token = rawToken?.trim();

  if (!token) {
    return (
      <InviteUnavailableCard
        title="Invite link is invalid"
        message="This invite link is missing a token. Ask the organization to resend it."
      />
    );
  }

  if (orgInviteVisualFixturesEnabled()) {
    const visualInvite = buildVisualOrgInvite(token);
    if (visualInvite) {
      return <AcceptInviteVisualClient invite={visualInvite} />;
    }
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
    return <InviteUnavailableCard />;
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
    return <InviteUnavailableCard />;
  }

  const invitationData = invitationRecord.data;
  const orgInfo = Array.isArray(invitationData.org) ? invitationData.org[0] : invitationData.org;

  if (!orgInfo?.slug) {
    return <InviteUnavailableCard />;
  }

  const { data: existingMembership } = await adminClient
    .from('organization_members')
    .select('user_id')
    .eq('org_id', invitationData.org_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingMembership) {
    redirect(`/app/o/${encodeURIComponent(orgInfo.slug)}/home`);
  }

  return (
    <AppSurface>
      <div className="flex items-center justify-center px-4 w-full h-[calc(100vh-8rem)]">
        <Card className="w-full max-w-md rounded-[24px] border-proofound-stone bg-white/90 shadow-[0_4px_24px_rgba(29,51,48,0.08)]">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-proofound-forest/10">
              <Mail className="h-5 w-5 text-proofound-forest" />
            </div>
            <CardTitle className="font-display text-2xl text-proofound-charcoal">
              You&apos;re invited
            </CardTitle>
            <CardDescription className="leading-6 text-proofound-charcoal/70">
              You&apos;ve been invited to join an organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4 rounded-lg bg-proofound-parchment/60 p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-proofound-forest/10">
                <Building2 className="h-5 w-5 text-proofound-forest" />
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
                  redirect(`/app/o/${encodeURIComponent(result.orgSlug)}/home`);
                }
              }}
              className="space-y-4"
            >
              <Button
                type="submit"
                className="w-full bg-proofound-forest text-white hover:bg-proofound-forest/90"
                size="lg"
              >
                Accept invitation
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
