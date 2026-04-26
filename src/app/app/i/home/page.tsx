import { requireAuth } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getDashboardMetrics } from '@/lib/dashboard/metrics';
import { ArrowRight, Briefcase, Eye, FileCheck2, ShieldCheck } from 'lucide-react';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

function ReadinessMeter({ value, label }: { value: number; label: string }) {
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

type ReadinessState = 'ok' | 'warn' | 'wait' | 'neutral';

function readinessStateClasses(state: ReadinessState) {
  switch (state) {
    case 'ok':
      return {
        icon: 'bg-[#dff0d9] text-proofound-forest',
        pill: 'bg-[#dff0d9] text-proofound-forest',
      };
    case 'warn':
      return {
        icon: 'bg-[#fff1df] text-[#8a4d1f]',
        pill: 'bg-[#fff1df] text-[#8a4d1f]',
      };
    case 'wait':
      return {
        icon: 'bg-[#eef3e8] text-proofound-forest',
        pill: 'bg-[#eef3e8] text-proofound-forest',
      };
    default:
      return {
        icon: 'bg-proofound-stone/35 text-muted-foreground',
        pill: 'bg-proofound-stone/35 text-muted-foreground',
      };
  }
}

export default async function IndividualHomePage() {
  const user = await requireAuth();

  // Safely load metrics with fallback values
  let metrics;
  try {
    metrics = await getDashboardMetrics();
  } catch (error) {
    console.error('Failed to load dashboard metrics:', error);
    // Fallback to default values if metrics fail to load
    metrics = {
      portfolioReadinessPercent: 0,
      proofStoriesCount: 0,
      verifiedSkills: 0,
      pendingVerifications: 0,
      qualifiedMatches: 0,
      activeIntroductions: 0,
    };
  }

  const userName = user.displayName || user.handle || 'there';
  const firstName = userName.split(' ')[0];
  const readinessPercent = Math.max(0, Math.min(100, metrics.portfolioReadinessPercent));
  const hasProof = metrics.proofStoriesCount > 0;
  const primaryProofLabel = hasProof ? 'Review Proof Packs' : 'Start proof record';
  const readinessScore = readinessPercent;
  const readinessTone =
    readinessScore >= 80
      ? 'Ready to share'
      : readinessScore >= 55
        ? 'Review before sharing'
        : 'Build the proof base';

  const proofRecords = [
    {
      icon: FileCheck2,
      title: 'Proof Packs',
      detail: hasProof
        ? `${metrics.proofStoriesCount} proof-backed signal${metrics.proofStoriesCount === 1 ? '' : 's'}`
        : 'No proof yet. Start with one private record.',
      status: hasProof ? 'Verified' : 'Pending',
      tone: hasProof ? 'success' : 'warning',
      href: '/app/i/profile?profileView=full&tab=proof_packs',
    },
    {
      icon: ShieldCheck,
      title: 'Trust anchors',
      detail:
        metrics.verifiedSkills > 0
          ? `${metrics.verifiedSkills} verified skill${metrics.verifiedSkills === 1 ? '' : 's'}`
          : metrics.pendingVerifications > 0
            ? `${metrics.pendingVerifications} verification request${metrics.pendingVerifications === 1 ? '' : 's'} pending`
            : 'No verifier yet. You can add this after the first proof.',
      status:
        metrics.verifiedSkills > 0
          ? 'Verified'
          : metrics.pendingVerifications > 0
            ? 'Pending'
            : 'Needed',
      tone:
        metrics.verifiedSkills > 0
          ? 'success'
          : metrics.pendingVerifications > 0
            ? 'warning'
            : 'neutral',
      href: '/app/i/verifications',
    },
    {
      icon: Eye,
      title: 'Portfolio visibility',
      detail: hasProof
        ? 'Public-safe sharing controls'
        : 'Private by default until you choose to share',
      status: readinessPercent >= 70 ? 'Shared' : 'Review',
      tone: readinessPercent >= 70 ? 'info' : 'neutral',
      href: '/app/i/profile?profileView=full&tab=visibility',
    },
  ];

  const readinessSteps = [
    {
      icon: FileCheck2,
      title: hasProof ? 'Proof Pack is present' : 'First proof artifact',
      detail: hasProof
        ? 'Check the context, evidence, and visibility before sharing.'
        : 'Start with one useful artifact. It stays private while you shape it.',
      action: hasProof ? 'Review proof' : 'Start proof',
      href: '/app/i/profile?profileView=full&tab=proof_packs',
      status: hasProof ? 'Ready' : 'Needed',
      state: hasProof ? 'ok' : 'warn',
    },
    {
      icon: ShieldCheck,
      title:
        metrics.verifiedSkills > 0
          ? 'Trust anchor verified'
          : metrics.pendingVerifications > 0
            ? 'Trust anchor in review'
            : 'Trust anchor missing',
      detail:
        metrics.pendingVerifications > 0
          ? `${metrics.pendingVerifications} verification request${metrics.pendingVerifications === 1 ? '' : 's'} pending`
          : metrics.verifiedSkills > 0
            ? `${metrics.verifiedSkills} verified skill${metrics.verifiedSkills === 1 ? '' : 's'} attached to your proof.`
            : 'Nothing is exposed yet. Add one trusted source when you are ready.',
      action: metrics.pendingVerifications > 0 ? 'View request' : 'Plan anchor',
      href: '/app/i/verifications',
      status:
        metrics.verifiedSkills > 0
          ? 'Verified'
          : metrics.pendingVerifications > 0
            ? 'Waiting'
            : 'Needed',
      state: metrics.verifiedSkills > 0 ? 'ok' : metrics.pendingVerifications > 0 ? 'wait' : 'warn',
    },
    {
      icon: Eye,
      title: readinessPercent >= 80 ? 'Portfolio can be shared' : 'Portfolio visibility review',
      detail:
        readinessPercent >= 80
          ? 'Your proof surface is ready for a final sharing pass.'
          : 'Sharing stays off by default until your proof and trust signals are clearer.',
      action: 'Set visibility',
      href: '/app/i/profile?profileView=full&tab=visibility',
      status: readinessPercent >= 80 ? 'Ready' : readinessPercent >= 55 ? 'Review' : 'Locked',
      state: readinessPercent >= 80 ? 'ok' : readinessPercent >= 55 ? 'wait' : 'warn',
    },
  ] satisfies Array<{
    icon: typeof FileCheck2;
    title: string;
    detail: string;
    action: string;
    href: string;
    status: string;
    state: ReadinessState;
  }>;
  const unresolvedReadinessSteps = readinessSteps.filter((step) => step.state !== 'ok').length;

  const scoreItems = [
    {
      label: `${metrics.verifiedSkills} verified skill${metrics.verifiedSkills === 1 ? '' : 's'}`,
      state: metrics.verifiedSkills > 0 ? 'ok' : 'warn',
    },
    {
      label: `${metrics.pendingVerifications} pending verification${metrics.pendingVerifications === 1 ? '' : 's'}`,
      state: metrics.pendingVerifications > 0 ? 'warn' : 'ok',
    },
    {
      label: `${metrics.proofStoriesCount} proof item${metrics.proofStoriesCount === 1 ? '' : 's'} ready`,
      state: hasProof ? 'ok' : 'warn',
    },
    {
      label: `Profile ${readinessPercent}% complete`,
      state: readinessPercent >= 70 ? 'ok' : 'warn',
    },
  ];

  return (
    <AppSurface density="comfortable" className="bg-[#f7f2ea]">
      <div className="flex flex-col gap-5">
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-5">
            <div className="rounded-lg border border-proofound-stone/70 bg-[#f3f6ef] p-5">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-5">
                  <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#dfead5] text-proofound-forest">
                    <Briefcase className="h-9 w-9" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-proofound-forest">
                      Next action
                    </p>
                    <h1 className="mt-1 text-2xl font-medium leading-tight text-proofound-charcoal md:text-3xl">
                      {hasProof ? 'Verify strongest proof record' : 'Add your first proof record'}
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Welcome back, {firstName}.{' '}
                      {hasProof
                        ? 'Your proof is ready for context, trust, and visibility review.'
                        : 'Start with one work sample, credential, or case study that can be trusted.'}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2 md:items-end">
                  <Button className="justify-between bg-proofound-forest px-6 text-white" asChild>
                    <Link href="/app/i/profile?profileView=full&tab=proof_packs">
                      {primaryProofLabel}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid items-start gap-5 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="overflow-hidden rounded-lg border border-proofound-stone/70 bg-white">
                <div className="flex items-center justify-between border-b border-proofound-stone/70 p-4">
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-xl font-medium text-proofound-charcoal">
                      Your Proof Wallet
                    </h2>
                    <Badge variant="outline" className="bg-[#fbf8f1]">
                      {proofRecords.length} records
                    </Badge>
                  </div>
                </div>
                <div className="divide-y divide-proofound-stone/70">
                  {proofRecords.map(({ icon: Icon, title, detail, status, tone, href }) => (
                    <Link
                      key={title}
                      href={href}
                      className="flex flex-col gap-3 p-4 transition-colors hover:bg-[#fbf8f1] sm:flex-row sm:items-center sm:gap-4"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef3e8] text-proofound-forest">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-proofound-charcoal">{title}</p>
                          <p className="text-xs leading-5 text-muted-foreground">{detail}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 pl-[52px] sm:pl-0">
                        <span
                          className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                            tone === 'success'
                              ? 'bg-[#dff0d9] text-proofound-forest'
                              : tone === 'warning'
                                ? 'bg-[#fff1d6] text-[#8a5b00]'
                                : tone === 'info'
                                  ? 'bg-[#dcecf8] text-[#28628a]'
                                  : 'bg-proofound-stone/35 text-muted-foreground'
                          }`}
                        >
                          {status}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="border-t border-proofound-stone/70 p-4">
                  <Link
                    href="/app/i/profile?profileView=full&tab=proof_packs"
                    className="inline-flex items-center gap-2 text-sm font-medium text-proofound-forest"
                  >
                    Add new record
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="rounded-lg border border-proofound-stone/70 bg-white p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-xl font-medium text-proofound-charcoal">
                    Readiness Checklist
                  </h2>
                  <Badge variant="outline">
                    {unresolvedReadinessSteps > 0
                      ? `${unresolvedReadinessSteps} to resolve`
                      : 'Ready'}
                  </Badge>
                </div>
                <div className="space-y-5">
                  {readinessSteps.map(
                    ({ icon: Icon, title, detail, action, href, status, state }) => {
                      const stateClasses = readinessStateClasses(state);

                      return (
                        <div
                          key={title}
                          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
                        >
                          <div className="flex min-w-0 flex-1 gap-3">
                            <span
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${stateClasses.icon}`}
                            >
                              <Icon className="h-6 w-6" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-proofound-charcoal">{title}</p>
                                <span
                                  className={`rounded-md px-2 py-0.5 text-xs font-medium ${stateClasses.pill}`}
                                >
                                  {status}
                                </span>
                              </div>
                              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                                {detail}
                              </p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="w-full sm:w-auto" asChild>
                            <Link href={href}>{action}</Link>
                          </Button>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </div>

          <aside className="flex min-w-0 flex-col gap-5">
            <div className="rounded-lg border border-proofound-stone/70 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-xl font-medium text-proofound-charcoal">
                  Proof Readiness
                </h2>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
              <div className="mt-5 flex items-end gap-2">
                <p className="font-display text-5xl text-proofound-forest">{readinessScore}</p>
                <p className="pb-2 text-sm text-muted-foreground">{readinessTone}</p>
              </div>
              <div className="mt-4">
                <ReadinessMeter value={readinessScore} label="Proof readiness" />
              </div>
              <div className="mt-5 space-y-3">
                {scoreItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        item.state === 'ok' ? 'bg-proofound-forest' : 'bg-[#e59f35]'
                      }`}
                    />
                  </div>
                ))}
              </div>
              <Link
                href="/app/i/profile?profileView=full&tab=proof_packs"
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-proofound-forest"
              >
                {hasProof ? 'Review proof readiness' : 'Start proof readiness'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </section>
      </div>
    </AppSurface>
  );
}
