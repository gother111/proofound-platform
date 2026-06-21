import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  OrgCollaboratorInviteCard,
  type OrgInviteFormState,
} from '@/components/org/OrgCollaboratorInviteCard';
import { inviteMemberFormAction } from '@/actions/org';
import { getActiveOrg, requireAuth } from '@/lib/auth';
import type { OrgRole } from '@/lib/authz';
import { getVerifiedOrganizationDomainPath } from '@/lib/organizations/trust-profile';
import {
  buildVisualAssignmentFixtures,
  visualAssignmentFixturesEnabled,
  VISUAL_ASSIGNMENT_MOCK_ORG_ID,
} from '@/lib/assignments/visual-fixtures';
import { buildOrgTrustReadiness, countReadyTrustItems } from '@/lib/organizations/trust-readiness';
import { createClient } from '@/lib/supabase/server';

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

function getAssignmentLaunchStatus(createdAt: string | null | undefined) {
  if (!createdAt) return 'Launch date pending';

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return 'Launch date pending';

  return `Launched on ${date.toLocaleDateString()}`;
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
  const canInviteCollaborators = membership.role === 'org_owner';

  // Fetch active collaborators/members
  const supabase = await createClient();
  const { data: membersRaw } = await supabase
    .from('organization_members')
    .select(
      `
      id,
      role,
      user_id,
      profiles (
        id,
        display_name,
        avatar_url
      )
    `
    )
    .eq('org_id', org.id)
    .eq('state', 'active');

  const collaborators = (membersRaw ?? []).map((m: any) => ({
    id: m.id ?? m.user_id ?? `${m.role ?? 'member'}-${m.profiles?.display_name ?? 'unknown'}`,
    role: m.role as OrgRole,
    userId: m.user_id,
    displayName: m.profiles?.display_name || 'Collaborator',
  }));

  // Fetch assignments (visual fixtures override mock org home when enabled)
  let assignmentsData: Array<{
    id: string;
    role: string;
    status: string;
    creation_status: string;
    created_at: string;
  }> | null = null;

  if (visualAssignmentFixturesEnabled() && org.id === VISUAL_ASSIGNMENT_MOCK_ORG_ID) {
    assignmentsData = buildVisualAssignmentFixtures(org.id).map((fixture) => ({
      id: fixture.id,
      role: fixture.role,
      status: fixture.status,
      creation_status: fixture.creationStatus,
      created_at: fixture.createdAt,
    }));
  } else {
    const { data } = await supabase
      .from('assignments')
      .select('id, role, status, creation_status, created_at')
      .eq('org_id', org.id)
      .order('created_at', { ascending: false });
    assignmentsData = data;
  }

  const activeAssignment =
    assignmentsData?.find((a) => a.status === 'active') || assignmentsData?.[0];

  const verifiedDomainPath = getVerifiedOrganizationDomainPath({
    website: org.website,
    websiteVerifiedAt: org.websiteVerifiedAt ?? null,
    trustStatus: org.trustStatus ?? null,
    verified: org.verified,
  });

  const operatingContext = org.workingContext ?? null;
  const trustItems = buildOrgTrustReadiness({
    displayName: org.displayName,
    whyWorkMatters: org.tagline,
    mission: org.mission,
    operatingContext,
    domainPathDetail: verifiedDomainPath,
    domainReady: Boolean(verifiedDomainPath),
  });
  const trustReadyCount = countReadyTrustItems(trustItems);
  const needsTrustWork = trustReadyCount < trustItems.length;

  const inviteAction = inviteMemberFormAction.bind(null, org.id) as (
    state: OrgInviteFormState,
    formData: FormData
  ) => Promise<OrgInviteFormState>;

  // Determine corridor state
  let corridorState: 'needs_trust' | 'no_assignments' | 'active_assignment' | 'draft_assignment' =
    'needs_trust';
  if (!needsTrustWork) {
    if (!activeAssignment) {
      corridorState = 'no_assignments';
    } else if (activeAssignment.status === 'active') {
      corridorState = 'active_assignment';
    } else {
      corridorState = 'draft_assignment';
    }
  }

  return (
    <AppSurface density="comfortable" className="bg-[#f7f2ea]">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-proofound-stone/50 pb-5">
          <div>
            <h1 className="font-display text-3xl font-semibold text-proofound-charcoal dark:text-foreground">
              {org.displayName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Current review workspace</p>
          </div>
          <Badge
            variant="outline"
            className="border-proofound-forest/30 bg-proofound-forest/5 text-proofound-forest self-start md:self-auto"
          >
            Signed in as {getRoleLabel(membership.role)}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Active Corridor Card */}
          <div className="md:col-span-2 space-y-4">
            <Card
              variant="bento"
              className="p-6 md:p-8 flex flex-col justify-between min-h-[300px]"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-proofound-forest">
                    Review status
                  </span>
                  {corridorState === 'needs_trust' && (
                    <Badge
                      variant="outline"
                      className="border-amber-500 text-amber-500 bg-amber-50"
                    >
                      Action needed
                    </Badge>
                  )}
                  {corridorState === 'no_assignments' && (
                    <Badge
                      variant="outline"
                      className="border-emerald-500 text-emerald-500 bg-emerald-50"
                    >
                      Ready for assignment
                    </Badge>
                  )}
                  {corridorState === 'active_assignment' && (
                    <Badge
                      variant="outline"
                      className="border-proofound-forest text-proofound-forest bg-[#eef3e8]"
                    >
                      Reviewing submissions
                    </Badge>
                  )}
                  {corridorState === 'draft_assignment' && (
                    <Badge
                      variant="outline"
                      className="border-amber-500 text-amber-500 bg-amber-50"
                    >
                      Draft assignment
                    </Badge>
                  )}
                </div>

                {corridorState === 'needs_trust' && (
                  <div className="space-y-3">
                    <h2 className="text-xl font-semibold text-proofound-charcoal">
                      Complete the trust page
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Before you can publish assignments and receive proof-backed matches, complete
                      the organization trust page. Name, mission, why the work matters, operating
                      context, and verified domain path keep review grounded.
                    </p>
                    <div className="text-xs text-muted-foreground font-medium pt-2">
                      Progress: {trustReadyCount}/{trustItems.length} launch essentials ready
                    </div>
                  </div>
                )}

                {corridorState === 'no_assignments' && (
                  <div className="space-y-3">
                    <h2 className="text-xl font-semibold text-proofound-charcoal">
                      Create the first assignment
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Your organization trust profile is active. Define a proof-led assignment
                      (real-world context, required evidence, and compensation bounds) to open the
                      assignment-review corridor.
                    </p>
                  </div>
                )}

                {corridorState === 'active_assignment' && activeAssignment && (
                  <div className="space-y-3">
                    <h2 className="text-xl font-semibold text-proofound-charcoal">
                      {activeAssignment.role}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Submission summaries are organized around proof relevance, verification
                      readiness, and privacy-safe review context. Review the evidence before opening
                      any identity reveal request.
                    </p>
                    <div className="text-xs text-muted-foreground font-medium pt-2">
                      {getAssignmentLaunchStatus(activeAssignment.created_at)}
                    </div>
                  </div>
                )}

                {corridorState === 'draft_assignment' && activeAssignment && (
                  <div className="space-y-3">
                    <h2 className="text-xl font-semibold text-proofound-charcoal">
                      Resume assignment: {activeAssignment.role}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      You have an incomplete assignment corridor. Finish defining the requirements
                      to open proof-led assignment review.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-4 border-t border-proofound-stone/50">
                {corridorState === 'needs_trust' && (
                  <Button
                    asChild
                    className="bg-proofound-forest text-white hover:bg-proofound-forest/90 w-full sm:w-auto"
                  >
                    <Link href={`/app/o/${slug}/profile`}>
                      Complete trust page
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                )}
                {corridorState === 'no_assignments' && (
                  <Button
                    asChild
                    className="bg-proofound-forest text-white hover:bg-proofound-forest/90 w-full sm:w-auto"
                  >
                    <Link href={`/app/o/${slug}/assignments/new`}>
                      Create first assignment
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                )}
                {corridorState === 'active_assignment' && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      asChild
                      className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
                    >
                      <Link href={`/app/o/${slug}/assignments`}>
                        Review submissions
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="border-proofound-stone text-proofound-charcoal bg-white"
                    >
                      <Link href={`/app/o/${slug}/assignments/new`}>
                        <Plus className="h-4 w-4 mr-2" />
                        New assignment
                      </Link>
                    </Button>
                  </div>
                )}
                {corridorState === 'draft_assignment' && (
                  <Button
                    asChild
                    className="bg-proofound-forest text-white hover:bg-proofound-forest/90 w-full sm:w-auto"
                  >
                    <Link href={`/app/o/${slug}/assignments/new`}>
                      Resume assignment setup
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card variant="bento" className="p-5 space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-proofound-charcoal">Team access</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Members authorized to review matches
                </p>
              </div>

              <div className="space-y-3">
                {collaborators.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between py-1.5 border-b border-proofound-stone/30 last:border-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-proofound-stone text-proofound-charcoal flex items-center justify-center text-xs font-semibold shrink-0">
                        {c.displayName[0].toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-proofound-charcoal truncate">
                        {c.displayName}
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0.5 bg-proofound-stone/40 text-proofound-charcoal font-medium"
                    >
                      {getRoleLabel(c.role)}
                    </Badge>
                  </div>
                ))}
              </div>

              {canInviteCollaborators && (
                <div className="pt-4 border-t border-proofound-stone/50">
                  <OrgCollaboratorInviteCard action={inviteAction} />
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AppSurface>
  );
}
