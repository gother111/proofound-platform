import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { Badge } from '@/components/ui/badge';
import {
  OrgCollaboratorInviteCard,
  type OrgInviteFormState,
} from '@/components/org/OrgCollaboratorInviteCard';
import { inviteMember } from '@/actions/org';
import { getActiveOrg, requireAuth } from '@/lib/auth';
import type { OrgRole } from '@/lib/authz';
import { getVerifiedOrganizationDomainPath } from '@/lib/organizations/trust-profile';

export const dynamic = 'force-dynamic';

function TrustMeter({ value, label }: { value: number; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className="h-2 w-full overflow-hidden rounded-full bg-proofound-stone/45"
    >
      <div className="h-full rounded-full bg-proofound-forest" style={{ width: `${value}%` }} />
    </div>
  );
}

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
  const roleLabel = getRoleLabel(membership.role);
  const canEditTrustProfile = ['org_owner', 'org_manager'].includes(membership.role);
  const canInviteCollaborators = membership.role === 'org_owner';
  const verifiedDomainPath = getVerifiedOrganizationDomainPath({
    website: org.website,
    websiteVerifiedAt: org.websiteVerifiedAt ?? null,
    trustStatus: org.trustStatus ?? null,
    verified: org.verified,
  });
  const missionReady = Boolean(org.mission?.trim());
  const domainReady = Boolean(verifiedDomainPath || org.verified);
  const contextReady = Boolean(
    org.workingContext?.trim() || org.hiringProcessSummary?.trim() || org.tagline?.trim()
  );
  const trustReadyCount = [missionReady, domainReady, contextReady].filter(Boolean).length;
  const trustProgress = Math.round((trustReadyCount / 3) * 100);
  const needsTrustWork = trustReadyCount < 3;
  const assignmentReady = trustReadyCount === 3;
  const missingTrustEssentials = [
    !missionReady ? 'mission' : null,
    !domainReady ? 'verified domain path' : null,
    !contextReady ? 'operating context' : null,
  ].filter(Boolean);
  const primaryActionHref = needsTrustWork
    ? `/app/o/${slug}/profile`
    : `/app/o/${slug}/assignments/new`;
  const primaryActionLabel = needsTrustWork
    ? canEditTrustProfile
      ? 'Complete trust profile'
      : 'Review trust profile'
    : 'Create assignment';
  const readinessActionLabel = needsTrustWork
    ? canEditTrustProfile
      ? 'Complete trust profile'
      : 'Review trust profile'
    : 'Create first assignment';

  const queueItems = [
    {
      label: 'Trust profile',
      subject: org.displayName,
      detail: verifiedDomainPath
        ? `Verified path: ${verifiedDomainPath}`
        : 'Add the basics once. Review stays locked until trust is clear.',
      priority: domainReady ? 'Ready' : 'High',
      value: `${trustProgress}%`,
      meter: trustProgress,
      tone: domainReady ? 'complete' : 'attention',
      href: `/app/o/${slug}/profile`,
    },
    {
      label: 'One assignment path',
      subject: 'Proof expectations',
      detail: assignmentReady
        ? 'Purpose, real work, constraints, and evidence stay in one builder'
        : 'This opens after the trust profile has enough context.',
      priority: assignmentReady ? 'Ready' : 'Next',
      value: assignmentReady ? 'Can start' : 'Needs trust',
      tone: assignmentReady ? 'active' : 'pending',
      href: `/app/o/${slug}/assignments/new`,
    },
    {
      label: 'Match review',
      subject: 'Privacy-safe summaries',
      detail: assignmentReady
        ? 'Review proof before identity reveal or direct outreach'
        : 'No candidate review starts until the corridor is ready.',
      priority: 'Guarded',
      value: assignmentReady ? 'Needs assignment' : 'Locked',
      tone: assignmentReady ? 'attention' : 'pending',
      href: `/app/o/${slug}/matching`,
    },
  ] as const;

  const trustChecks = [
    {
      label: 'Mission and operating context',
      value: missionReady || contextReady ? 'Present' : 'Needed',
      pass: missionReady || contextReady,
    },
    {
      label: 'Verified organization path',
      value: domainReady ? 'Verified' : 'Needed',
      pass: domainReady,
    },
    {
      label: 'Privacy-safe review posture',
      value: 'Enforced',
      pass: true,
    },
  ];

  const teamRows = [
    {
      label: 'Owner',
      detail: 'Owns trust profile, launch setup, and collaborator access.',
      current: roleLabel === 'Owner',
    },
    {
      label: 'Manager',
      detail: 'Maintains the org profile and assignment corridor.',
      current: roleLabel === 'Manager',
    },
    {
      label: 'Reviewer',
      detail: 'Reviews proof summaries without broadening access.',
      current: roleLabel === 'Reviewer',
    },
  ];

  const inviteAction = async (
    _state: OrgInviteFormState,
    formData: FormData
  ): Promise<OrgInviteFormState> => {
    'use server';

    const result = await inviteMember(org.id, formData);

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
    <AppSurface density="comfortable" className="bg-[#f7f2ea]">
      <div className="flex flex-col gap-5">
        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-5">
            <div className="rounded-lg border border-proofound-stone/70 bg-[#f3f6ef] p-5">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-5">
                  <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#dfead5] text-proofound-forest">
                    <Users className="h-9 w-9" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-proofound-forest/20 bg-white/65 text-proofound-forest"
                      >
                        Organization review cockpit
                      </Badge>
                    </div>
                    <h1 className="mt-2 text-2xl font-medium leading-tight text-proofound-charcoal md:text-3xl">
                      {org.displayName}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                      A focused launch desk for one clean hiring corridor: compose the trust
                      profile, define one proof-led assignment, and review candidates through
                      privacy-safe summaries.
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2 md:items-end">
                  <Button className="justify-between bg-proofound-forest px-6 text-white" asChild>
                    <Link href={primaryActionHref}>
                      {primaryActionLabel}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-proofound-stone/70 bg-white">
              <div className="border-b border-proofound-stone/70 p-4">
                <h2 className="font-display text-xl font-medium text-proofound-charcoal">
                  Corridor Queue
                </h2>
              </div>
              <div className="divide-y divide-proofound-stone/70">
                {queueItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex flex-col gap-3 p-4 transition-colors hover:bg-[#fbf8f1] sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span
                        className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium ${
                          item.tone === 'attention'
                            ? 'bg-[#fff1df] text-[#8a4d1f]'
                            : item.tone === 'complete'
                              ? 'bg-[#dff0d9] text-proofound-forest'
                              : item.tone === 'active'
                                ? 'bg-[#eef3e8] text-proofound-forest'
                                : 'bg-proofound-stone/35 text-muted-foreground'
                        }`}
                      >
                        {item.priority}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-proofound-charcoal">
                          {item.subject}
                        </p>
                        <p className="text-xs leading-5 text-muted-foreground">
                          {item.label} · {item.detail}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:min-w-32 sm:justify-end">
                      {'meter' in item ? (
                        <div className="hidden w-24 shrink-0 sm:block">
                          <TrustMeter value={item.meter} label={`${item.label} readiness`} />
                        </div>
                      ) : null}
                      <span className="text-sm font-semibold text-proofound-charcoal">
                        {item.value}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <aside className="flex min-w-0 flex-col gap-5">
            <div className="rounded-lg border border-proofound-stone/70 bg-white p-5">
              <h2 className="font-display text-xl font-medium text-proofound-charcoal">
                Launch Summary
              </h2>
              <div className="mt-5 flex items-end gap-2">
                <p className="font-display text-5xl text-proofound-forest">{trustReadyCount}</p>
                <p className="pb-2 text-sm text-muted-foreground">/ 3 trust essentials ready</p>
              </div>
              <div className="mt-4">
                <TrustMeter value={trustProgress} label="Organization launch readiness" />
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {missingTrustEssentials.length > 0
                  ? `Next: add ${missingTrustEssentials[0]}. Nothing is shared or reviewed until these basics are ready.`
                  : 'Trust essentials are ready. The next useful move is assignment drafting.'}
              </p>
              <div className="mt-5 space-y-3">
                {trustChecks.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        item.pass ? 'bg-proofound-forest' : 'bg-[#e59f35]'
                      }`}
                    />
                  </div>
                ))}
              </div>
              <Link
                href={`/app/o/${slug}/profile`}
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-proofound-forest"
              >
                {readinessActionLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-lg border border-proofound-stone/70 bg-white p-5">
              <div className="mb-4">
                <h2 className="font-display text-xl font-medium text-proofound-charcoal">
                  Minimal Access
                </h2>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                Launch roles are limited to owner, manager, and reviewer.
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                You are currently signed in as {roleLabel}.
              </p>
              <div className="mt-5 overflow-hidden rounded-lg border border-proofound-stone/70 bg-[#fbf8f1]">
                {teamRows.map((row) => (
                  <div
                    key={row.label}
                    className="border-b border-proofound-stone/60 p-3 last:border-b-0"
                  >
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-proofound-charcoal">{row.label}</span>
                      {row.current ? (
                        <span className="rounded-full bg-[#dff0d9] px-2 py-0.5 text-xs font-medium text-proofound-forest">
                          Current
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{row.detail}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 border-t border-proofound-stone/70 pt-5">
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
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AppSurface>
  );
}
