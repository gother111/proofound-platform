import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileCheck2,
  LockKeyhole,
  ShieldCheck,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  OrgCollaboratorInviteCard,
  type OrgInviteFormState,
} from '@/components/org/OrgCollaboratorInviteCard';
import { inviteMember } from '@/actions/org';
import { getActiveOrg, requireAuth } from '@/lib/auth';
import type { OrgRole } from '@/lib/authz';
import { getVerifiedOrganizationDomainPath } from '@/lib/organizations/trust-profile';

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
  const trustLabel =
    trustReadyCount === 3
      ? 'Trust profile composed'
      : domainReady
        ? 'Trust profile in progress'
        : 'Trust signal needed';

  const corridorSteps = [
    {
      label: 'Trust profile',
      detail: `${trustReadyCount}/3 essentials`,
      complete: trustReadyCount >= 2,
      href: `/app/o/${slug}/profile`,
    },
    {
      label: 'Assignment',
      detail: 'Purpose, outcomes, proof',
      complete: false,
      href: `/app/o/${slug}/assignments/new`,
    },
    {
      label: 'Proof review',
      detail: 'Privacy-safe summaries',
      complete: false,
      href: `/app/o/${slug}/matching`,
    },
    {
      label: 'Intro and reveal',
      detail: 'Consent-led corridor',
      complete: false,
      href: `/app/o/${slug}/matching`,
    },
    {
      label: 'Decision',
      detail: 'Hire, no-hire, verify',
      complete: false,
      href: `/app/o/${slug}/matching`,
    },
  ];

  const trustModules = [
    {
      icon: ShieldCheck,
      label: 'Legitimacy',
      value: domainReady ? 'Active' : 'Needed',
      description: verifiedDomainPath
        ? `Verified domain path: ${verifiedDomainPath}.`
        : 'Confirm the domain or platform-reviewed trust signal before relying on review flows.',
      href: `/app/o/${slug}/profile`,
    },
    {
      icon: ClipboardCheck,
      label: 'Assignment clarity',
      value: '5 steps',
      description:
        'The builder keeps the org focused on why the role exists, actual work, proof, constraints, and review.',
      href: `/app/o/${slug}/assignments/new`,
    },
    {
      icon: LockKeyhole,
      label: 'Review privacy',
      value: 'Blind first',
      description:
        'Candidate identity and direct portfolio paths stay hidden until the corridor opens them.',
      href: `/app/o/${slug}/matching`,
    },
  ];

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
    <AppSurface density="spacious" className="bg-[#f7f2ea]">
      <div className="flex flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-proofound-stone/70 bg-[#fbf8f1] shadow-[0_24px_70px_-44px_rgba(86,98,79,0.45)]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <div className="space-y-8 p-6 sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant="outline"
                  className="border-proofound-forest/20 bg-white/60 text-proofound-forest"
                >
                  Organization review cockpit
                </Badge>
                <span className="text-sm text-muted-foreground">Signed in as {roleLabel}</span>
              </div>

              <div className="max-w-3xl space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-proofound-forest text-white">
                    <Building2 className="h-6 w-6" />
                  </span>
                  <h1 className="text-4xl font-medium leading-[1.05] text-proofound-charcoal md:text-6xl">
                    {org.displayName}
                  </h1>
                </div>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                  A focused launch desk for one clean hiring corridor: maintain a credible trust
                  profile, write one assignment with proof expectations, and review candidates
                  through privacy-safe summaries.
                </p>
                {org.tagline ? (
                  <p className="max-w-2xl rounded-2xl border border-proofound-stone/60 bg-white/55 p-4 text-sm leading-6 text-proofound-charcoal">
                    {org.tagline}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="justify-between px-6" asChild>
                  <Link href={`/app/o/${slug}/assignments/new`}>
                    Create or continue assignment
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-white/50" asChild>
                  <Link href={`/app/o/${slug}/profile`}>
                    {canEditTrustProfile ? 'Edit trust profile' : 'Review trust profile'}
                  </Link>
                </Button>
              </div>
            </div>

            <aside className="border-t border-proofound-stone/70 bg-white/45 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Current state</p>
                    <p className="mt-1 text-3xl font-semibold text-proofound-charcoal">
                      {trustLabel}
                    </p>
                  </div>
                  <Badge className="bg-proofound-forest text-white">{trustProgress}%</Badge>
                </div>

                <Progress
                  value={trustProgress}
                  aria-label="Organization trust profile readiness"
                  className="h-2 bg-proofound-stone/45"
                  indicatorClassName="bg-proofound-forest"
                />

                <div className="grid gap-3">
                  <div className="rounded-2xl border border-proofound-stone/60 bg-[#fbf8f1] p-4">
                    <p className="text-sm font-semibold text-proofound-charcoal">
                      Trust essentials
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <span
                        className={`rounded-full px-3 py-1.5 text-center ${
                          missionReady
                            ? 'bg-proofound-forest text-white'
                            : 'bg-proofound-stone/35 text-muted-foreground'
                        }`}
                      >
                        Mission
                      </span>
                      <span
                        className={`rounded-full px-3 py-1.5 text-center ${
                          domainReady
                            ? 'bg-proofound-forest text-white'
                            : 'bg-proofound-stone/35 text-muted-foreground'
                        }`}
                      >
                        Domain
                      </span>
                      <span
                        className={`rounded-full px-3 py-1.5 text-center ${
                          contextReady
                            ? 'bg-proofound-forest text-white'
                            : 'bg-proofound-stone/35 text-muted-foreground'
                        }`}
                      >
                        Context
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-proofound-stone/70 bg-[#f7f2ea] p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-proofound-charcoal">
                      <Eye className="h-4 w-4 text-proofound-forest" />
                      One queue, not an ATS
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Review stays centered on proof summaries, outcomes, verification fit, and
                      clear next decisions.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section aria-label="Organization corridor" className="grid gap-3 md:grid-cols-5">
          {corridorSteps.map((step, index) => (
            <Link
              key={step.label}
              href={step.href}
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
            >
              <div
                className={`group flex h-full min-h-[116px] flex-col justify-between rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:border-proofound-forest/45 ${
                  step.complete
                    ? 'border-proofound-forest/25 bg-white shadow-[0_16px_36px_-28px_rgba(86,98,79,0.55)]'
                    : 'border-proofound-stone/65 bg-white/55'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-muted-foreground">
                    Step {index + 1}
                  </span>
                  {step.complete ? (
                    <CheckCircle2 className="h-4 w-4 text-proofound-forest" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-proofound-stone" aria-hidden="true" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-proofound-charcoal">{step.label}</p>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">{step.detail}</p>
                </div>
              </div>
            </Link>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="rounded-[1.75rem] border border-proofound-stone/70 bg-white p-6 shadow-[0_18px_48px_-38px_rgba(86,98,79,0.5)] sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-proofound-forest">
                  <FileCheck2 className="h-4 w-4" />
                  Assignment quality desk
                </p>
                <h2 className="mt-3 text-3xl font-medium leading-tight text-proofound-charcoal">
                  Make the role easier to judge by proof.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                  The strongest org journey is not more widgets. It is one clear assignment that
                  explains the value, the actual work, the proof that would convince you, and the
                  practical constraints.
                </p>
              </div>
              <Button asChild className="shrink-0">
                <Link href={`/app/o/${slug}/assignments/new`}>
                  Open builder
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ['Why it exists', 'Business value before generic job description.'],
                ['What work counts', 'Deliverables and outcomes stay visible.'],
                ['What proof counts', 'Evidence requirements guide review decisions.'],
              ].map(([label, description]) => (
                <div key={label} className="rounded-2xl bg-[#f7f2ea] p-4">
                  <ClipboardCheck className="h-5 w-5 text-proofound-forest" />
                  <p className="mt-3 text-sm font-semibold text-proofound-charcoal">{label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {trustModules.map(({ icon: Icon, label, value, description, href }) => (
              <Link
                key={label}
                href={href}
                className="group block rounded-[1.5rem] border border-proofound-stone/70 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-proofound-forest/35 hover:shadow-[0_18px_44px_-34px_rgba(86,98,79,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="rounded-xl bg-proofound-forest/10 p-2 text-proofound-forest">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-proofound-charcoal">{label}</p>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-proofound-charcoal">
                    {value}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border-proofound-stone/60 bg-white/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-proofound-forest" />
                Trust Profile
              </CardTitle>
              <CardDescription>
                Org name, verified domain path, mission, why the work matters, and operating
                context.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                {org.mission?.trim() ? 'Mission is present.' : 'Mission still needs to be added.'}
              </p>
              <p>
                {verifiedDomainPath
                  ? `Verified domain path is ${verifiedDomainPath}.`
                  : 'Verified domain signal still needs to be confirmed.'}
              </p>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href={`/app/o/${slug}/profile`}>
                  {canEditTrustProfile ? 'Edit trust profile' : 'Review trust profile'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-proofound-stone/60 bg-white/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardCheck className="h-5 w-5 text-proofound-forest" />
                One Assignment Path
              </CardTitle>
              <CardDescription>
                Build one assignment through five review-centered steps, then publish from internal
                review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                The builder stays narrow: role purpose, actual work, proof expectations, practical
                constraints, and review.
              </p>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href={`/app/o/${slug}/assignments/new`}>
                  Create or continue assignment
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-proofound-stone/60 bg-white/80">
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
                Reviewers can review the queue and published work, but they cannot broaden the org
                corridor into a larger suite.
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
