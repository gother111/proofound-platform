import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Building2, ClipboardCheck, ShieldCheck, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import {
  OrgCollaboratorInviteCard,
  type OrgInviteFormState,
} from '@/components/org/OrgCollaboratorInviteCard';
import { inviteMember } from '@/actions/org';
import { getActiveOrg, requireAuth } from '@/lib/auth';
import type { OrgRole } from '@/lib/authz';
import { normalizeOrganizationValues } from '@/lib/organizations/normalizeValues';

export const dynamic = 'force-dynamic';

function getRoleLabel(role: OrgRole) {
  switch (role) {
    case 'org_owner':
      return 'Owner';
    case 'org_manager':
      return 'Manager';
    case 'org_reviewer':
      return 'Reviewer';
    default:
      return 'Member';
  }
}

export default async function OrganizationHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireAuth();
  const { slug } = await params;
  const result = await getActiveOrg(slug, user.id);

  if (!result) {
    notFound();
  }

  const { org, membership } = result;
  const values = normalizeOrganizationValues(org.values);
  const roleLabel = getRoleLabel(membership.role);
  const canEditTrustProfile = ['org_owner', 'org_manager'].includes(membership.role);
  const canInviteCollaborators = membership.role === 'org_owner';

  const inviteAction = async (
    _state: OrgInviteFormState,
    formData: FormData
  ): Promise<OrgInviteFormState> => {
    'use server';

    const result = await inviteMember(membership.orgId, formData);

    if (result.error) {
      return {
        status: 'error',
        message: result.error,
      };
    }

    return {
      status: 'success',
      message:
        result.warning ??
        'Invitation sent. The collaborator must accept their tokenized email invite before access is granted.',
    };
  };

  return (
    <AppSurface>
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <section
          className="rounded-3xl px-6 py-8 text-white"
          style={{
            background: 'linear-gradient(135deg, #1C4D3A 0%, #2D5F4A 45%, #1C4D3A 100%)',
          }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                <h1 className="text-3xl font-['Crimson_Pro']">{org.displayName}</h1>
              </div>
              <p className="text-sm text-white/90">
                The org launch corridor is intentionally narrow: keep the trust profile current,
                publish one assignment, and review matches from one queue.
              </p>
              {org.tagline ? <p className="text-sm text-white/75">{org.tagline}</p> : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-white text-proofound-forest hover:bg-japandi-bg">
                <Link href={`/app/o/${slug}/profile`}>
                  Open trust profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/15"
              >
                <Link href={`/app/o/${slug}/matching`}>
                  Open assignments & matches
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border-proofound-stone/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-proofound-forest" />
                Trust Profile
              </CardTitle>
              <CardDescription>
                Mission, why join, public website, core values, and lightweight work norms.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                {org.mission?.trim() ? 'Mission is present.' : 'Mission still needs to be added.'}
              </p>
              <p>
                {values.length > 0
                  ? `${values.length} core value${values.length === 1 ? '' : 's'} set.`
                  : 'Core values still need to be added.'}
              </p>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href={`/app/o/${slug}/profile`}>
                  {canEditTrustProfile ? 'Edit trust profile' : 'Review trust profile'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-proofound-stone/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardCheck className="h-5 w-5 text-proofound-forest" />
                One Assignment Path
              </CardTitle>
              <CardDescription>
                Create and refine assignments from a single flow, with Basic mode as the default.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Basic mode stays the default. Advanced mode only appears after explicit opt-in.</p>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href={`/app/o/${slug}/assignments/new`}>
                  Create or continue assignment
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-proofound-stone/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-proofound-forest" />
                Minimal Access
              </CardTitle>
              <CardDescription>
                Launch roles are limited to owner, manager, and reviewer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>You are currently signed in as {roleLabel}.</p>
              <p>
                Reviewers can review the queue and published work, but they cannot change org
                settings outside the launch corridor.
              </p>
              {canInviteCollaborators ? (
                <OrgCollaboratorInviteCard action={inviteAction} />
              ) : (
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link href={`/app/o/${slug}/matching`}>
                    Open review queue
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppSurface>
  );
}
