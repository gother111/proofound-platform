import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileCheck2,
  LockKeyhole,
  ShieldCheck,
  Users,
} from 'lucide-react';

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

function statusTone(status: 'complete' | 'active' | 'pending' | 'attention') {
  switch (status) {
    case 'complete':
      return 'border-proofound-forest bg-proofound-forest text-white';
    case 'active':
      return 'border-proofound-forest bg-[#eef3e8] text-proofound-forest';
    case 'attention':
      return 'border-[#d99058] bg-[#fff1df] text-[#8a4d1f]';
    default:
      return 'border-proofound-stone bg-white text-proofound-charcoal';
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
  const primaryActionHref = needsTrustWork
    ? `/app/o/${slug}/profile`
    : `/app/o/${slug}/assignments/new`;
  const primaryActionLabel = needsTrustWork
    ? canEditTrustProfile
      ? 'Complete trust profile'
      : 'Review trust profile'
    : 'Create assignment';

  const workflowSteps = [
    {
      number: '1',
      label: 'Trust profile',
      detail: `${trustReadyCount}/3 essentials`,
      status: trustReadyCount >= 2 ? 'complete' : 'active',
    },
    {
      number: '2',
      label: 'Assignment',
      detail: 'One proof-led role',
      status: trustReadyCount >= 3 ? 'active' : 'pending',
    },
    {
      number: '3',
      label: 'Proof review',
      detail: 'Blind first',
      status: 'pending',
    },
    {
      number: '4',
      label: 'Intro',
      detail: 'Consent-led',
      status: 'pending',
    },
    {
      number: '5',
      label: 'Decision',
      detail: 'Reviewable',
      status: 'pending',
    },
  ] as const;

  const queueItems = [
    {
      label: 'Trust profile',
      subject: org.displayName,
      detail: verifiedDomainPath
        ? `Verified path: ${verifiedDomainPath}`
        : 'Confirm legitimacy before relying on review flows',
      priority: domainReady ? 'Ready' : 'High',
      value: `${trustProgress}%`,
      meter: trustProgress,
      tone: domainReady ? 'complete' : 'attention',
      href: `/app/o/${slug}/profile`,
    },
    {
      label: 'One assignment path',
      subject: 'Proof expectations',
      detail: 'Purpose, real work, constraints, and evidence stay in one builder',
      priority: assignmentReady ? 'Ready' : 'Next',
      value: assignmentReady ? 'Draft' : 'Needs trust',
      tone: assignmentReady ? 'active' : 'pending',
      href: `/app/o/${slug}/assignments/new`,
    },
    {
      label: 'Match review',
      subject: 'Privacy-safe summaries',
      detail: 'Review proof before identity reveal or direct outreach',
      priority: 'Guarded',
      value: assignmentReady ? 'Open after publish' : 'Locked',
      tone: assignmentReady ? 'active' : 'pending',
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

  const stateNotes = [
    {
      title: domainReady ? 'Organization legitimacy signal active' : 'Domain verification is next',
      detail: domainReady
        ? 'Trust profile can support review.'
        : 'Complete the trust profile first.',
    },
    {
      title: 'Assignment builder is the source of truth',
      detail: 'One role, proof expectations, constraints, and internal review.',
    },
    {
      title: 'Review corridor stays privacy-safe',
      detail: 'Identity reveal waits for consent and corridor readiness.',
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
        <section className="rounded-lg border border-proofound-stone/70 bg-white p-4 shadow-[0_18px_54px_-46px_rgba(86,98,79,0.45)]">
          <div className="grid gap-3 lg:grid-cols-5">
            {workflowSteps.map((step, index) => (
              <div
                key={step.label}
                className={`relative flex min-h-[72px] items-center gap-3 rounded-lg p-3 ${
                  step.status === 'active' ? 'bg-[#f1f5ed]' : 'bg-transparent'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${statusTone(
                    step.status
                  )}`}
                >
                  {step.number}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-proofound-charcoal">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.detail}</p>
                </div>
                {index < workflowSteps.length - 1 ? (
                  <span className="ml-auto hidden h-px w-10 bg-proofound-stone lg:block" />
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
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
                      <span className="text-xs text-muted-foreground">
                        Signed in as {roleLabel}
                      </span>
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
                  <Link
                    href={`/app/o/${slug}/matching`}
                    className="text-sm font-medium text-proofound-forest underline-offset-4 hover:underline"
                  >
                    View review queue
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="overflow-hidden rounded-lg border border-proofound-stone/70 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-proofound-stone/70 p-4">
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-xl font-medium text-proofound-charcoal">
                      Corridor Queue
                    </h2>
                    <Badge variant="outline" className="bg-[#fbf8f1]">
                      MVP
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/app/o/${slug}/assignments/new`}>
                      Open builder
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="border-b border-proofound-stone/70 px-4 py-3">
                  <p className="text-sm leading-6 text-muted-foreground">
                    Each row is a real MVP surface: trust profile, assignment builder, or
                    privacy-safe match review.
                  </p>
                </div>
                <div className="divide-y divide-proofound-stone/70">
                  {queueItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center gap-4 p-4 transition-colors hover:bg-[#fbf8f1]"
                    >
                      <span
                        className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                          item.tone === 'attention'
                            ? 'bg-[#fff1df] text-[#8a4d1f]'
                            : item.tone === 'complete'
                              ? 'bg-[#dff0d9] text-proofound-forest'
                              : 'bg-proofound-stone/35 text-muted-foreground'
                        }`}
                      >
                        {item.priority}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-proofound-charcoal">
                          {item.subject}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.label} · {item.detail}
                        </p>
                      </div>
                      {'meter' in item ? (
                        <div className="hidden w-24 shrink-0 sm:block">
                          <TrustMeter value={item.meter} label={`${item.label} readiness`} />
                        </div>
                      ) : null}
                      <span className="w-24 shrink-0 text-right text-sm font-semibold text-proofound-charcoal">
                        {item.value}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
                <div className="border-t border-proofound-stone/70 p-4">
                  <Link
                    href={`/app/o/${slug}/matching`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-proofound-forest"
                  >
                    View full queue
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="rounded-lg border border-proofound-stone/70 bg-white">
                <div className="border-b border-proofound-stone/70 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e5eedc] text-proofound-forest">
                        <ShieldCheck className="h-6 w-6" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-display text-xl font-medium text-proofound-charcoal">
                          Selected corridor
                        </p>
                        <p className="text-sm text-muted-foreground">{org.displayName}</p>
                      </div>
                    </div>
                    <span className="text-right">
                      <span className="block text-2xl font-semibold text-proofound-charcoal">
                        {trustProgress}%
                      </span>
                      <span className="text-xs text-muted-foreground">Trust profile</span>
                    </span>
                  </div>
                </div>
                <div className="grid gap-0 md:grid-cols-2">
                  <div className="space-y-4 border-b border-proofound-stone/70 p-4 md:border-b-0 md:border-r">
                    <h3 className="text-sm font-semibold text-proofound-charcoal">Proof summary</h3>
                    {trustChecks.map((check) => (
                      <div key={check.label} className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                            check.pass
                              ? 'bg-[#dff0d9] text-proofound-forest'
                              : 'bg-[#fff1df] text-[#8a4d1f]'
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-proofound-charcoal">
                            {check.label}
                          </p>
                          <p className="text-xs text-muted-foreground">{check.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4 p-4">
                    <h3 className="text-sm font-semibold text-proofound-charcoal">
                      Guardrails and checks
                    </h3>
                    <div className="space-y-3 text-sm">
                      <p className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                        <span className="text-muted-foreground">Blind-first review</span>
                        <span className="font-medium text-proofound-forest">On</span>
                      </p>
                      <p className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                        <span className="text-muted-foreground">Consent traceability</span>
                        <span className="font-medium text-proofound-forest">On</span>
                      </p>
                      <p className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                        <span className="text-muted-foreground">Minimal roles</span>
                        <span className="font-medium text-proofound-forest">3 roles</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button size="sm" asChild>
                        <Link href={`/app/o/${slug}/assignments/new`}>Open assignment</Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/app/o/${slug}/profile`}>Review trust</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="flex min-w-0 flex-col gap-5">
            <div className="rounded-lg border border-proofound-stone/70 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-xl font-medium text-proofound-charcoal">
                  Launch Summary
                </h2>
                <span className="text-xs text-muted-foreground">MVP</span>
              </div>
              <div className="mt-5 flex items-end gap-2">
                <p className="font-display text-5xl text-proofound-forest">{trustReadyCount}</p>
                <p className="pb-2 text-sm text-muted-foreground">/ 3 trust essentials ready</p>
              </div>
              <div className="mt-4">
                <TrustMeter value={trustProgress} label="Organization launch readiness" />
              </div>
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
                Improve readiness
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-lg border border-proofound-stone/70 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl font-medium text-proofound-charcoal">
                  Minimal Access
                </h2>
                <Link
                  href={`/app/o/${slug}/matching`}
                  className="text-sm font-medium text-proofound-forest"
                >
                  Open queue
                </Link>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                Launch roles are limited to owner, manager, and reviewer.
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                You are currently signed in as {roleLabel}.
              </p>
              <div className="mt-5 space-y-4">
                {teamRows.map((row) => (
                  <div
                    key={row.label}
                    className="rounded-md border border-proofound-stone/60 bg-[#fbf8f1] p-3"
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

        <section className="grid items-start gap-5 xl:grid-cols-[1fr_1fr_1fr_1.15fr]">
          <div className="rounded-lg border border-proofound-stone/70 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-xl font-medium text-proofound-charcoal">
                Trust Profile
              </h2>
              <ShieldCheck className="h-5 w-5 text-proofound-forest" />
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Org name, verified domain path, mission, why the work matters, and operating context.
            </p>
            <Link
              href={`/app/o/${slug}/profile`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-proofound-forest"
            >
              {canEditTrustProfile ? 'Edit trust profile' : 'Review trust profile'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-lg border border-proofound-stone/70 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-xl font-medium text-proofound-charcoal">
                One Assignment Path
              </h2>
              <ClipboardCheck className="h-5 w-5 text-proofound-forest" />
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Role purpose, real work, proof expectations, constraints, and review stay together.
            </p>
            <Link
              href={`/app/o/${slug}/assignments/new`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-proofound-forest"
            >
              Continue assignment
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-lg border border-proofound-stone/70 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-xl font-medium text-proofound-charcoal">
                Policy & Trust
              </h2>
              <LockKeyhole className="h-5 w-5 text-proofound-forest" />
            </div>
            <div className="mt-3 space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center justify-between gap-3">
                <span>Active policy</span>
                <span className="font-medium text-proofound-charcoal">MVP corridor</span>
              </p>
              <p className="flex items-center justify-between gap-3">
                <span>Least-privilege access</span>
                <span className="font-medium text-proofound-charcoal">Enforced</span>
              </p>
              <p className="flex items-center justify-between gap-3">
                <span>Encrypted handling</span>
                <span className="font-medium text-proofound-charcoal">Always on</span>
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-proofound-stone/70 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-medium text-proofound-charcoal">
                Current State
              </h2>
              <Link
                href={`/app/o/${slug}/matching`}
                className="text-sm font-medium text-proofound-forest"
              >
                Open queue
              </Link>
            </div>
            <div className="space-y-4">
              {stateNotes.map((item) => (
                <div key={item.title} className="flex gap-3">
                  <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dff0d9] text-proofound-forest">
                    <FileCheck2 className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-proofound-charcoal">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-proofound-stone/70 bg-white p-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(260px,0.9fr)_1fr_1fr_1fr]">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-proofound-forest text-white">
                <Eye className="h-8 w-8" />
              </span>
              <div>
                <h2 className="font-display text-xl font-medium text-proofound-charcoal">
                  Review only what matters.
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Proof, context, consent, and decision history stay legible.
                </p>
              </div>
            </div>
            {[
              ['Blind by default', 'Review proof before identity reveal.'],
              ['Consent-led sharing', 'Every reveal is intentional and traceable.'],
              ['One corridor', 'The MVP stays focused on proof-first hiring.'],
            ].map(([title, detail]) => (
              <div key={title} className="flex gap-3">
                <span className="mt-1 text-proofound-charcoal">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-proofound-charcoal">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppSurface>
  );
}
