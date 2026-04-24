import { requireAuth } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getDashboardMetrics } from '@/lib/dashboard/metrics';
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Eye,
  FileCheck2,
  LockKeyhole,
  ShieldCheck,
  Users,
} from 'lucide-react';
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
  const hasMatchingMotion = metrics.qualifiedMatches > 0 || metrics.activeIntroductions > 0;
  const primaryProofLabel = hasProof ? 'Review Proof Packs' : 'Add your first proof';
  const readinessScore = readinessPercent;
  const readinessTone =
    readinessScore >= 80
      ? 'Ready to share'
      : readinessScore >= 55
        ? 'Review before sharing'
        : 'Build the proof base';

  const workflowSteps = [
    {
      number: '1',
      label: 'Identity',
      detail: 'Profile active',
      complete: true,
      href: '/app/i/profile?profileView=full',
    },
    {
      number: '2',
      label: 'Proof packs',
      detail: hasProof ? `${metrics.proofStoriesCount} present` : 'Next',
      active: true,
      href: '/app/i/profile?profileView=full&tab=proof_packs',
    },
    {
      number: '3',
      label: 'Trust anchors',
      detail:
        metrics.verifiedSkills > 0
          ? `${metrics.verifiedSkills} verified`
          : metrics.pendingVerifications > 0
            ? `${metrics.pendingVerifications} pending`
            : 'Request next',
      href: '/app/i/verifications',
    },
    {
      number: '4',
      label: 'Portfolio',
      detail: readinessPercent >= 70 ? 'Review visibility' : 'Needs proof',
      href: '/app/i/profile?profileView=full&tab=visibility',
    },
    {
      number: '5',
      label: 'Share',
      detail: readinessPercent >= 80 ? 'Ready' : 'Locked',
      href: '/app/i/profile?profileView=full&tab=visibility',
    },
  ];

  const proofRecords = [
    {
      icon: ShieldCheck,
      title: 'Identity verification',
      detail: 'Proofound ID',
      status: readinessPercent > 0 ? 'Verified' : 'Started',
      tone: 'success',
      href: '/app/i/profile?profileView=full',
    },
    {
      icon: FileCheck2,
      title: 'Proof Packs',
      detail: hasProof
        ? `${metrics.proofStoriesCount} proof-backed signal${metrics.proofStoriesCount === 1 ? '' : 's'}`
        : 'Add one work sample',
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
            : 'No verifier attached yet',
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
      detail: 'Public-safe sharing controls',
      status: readinessPercent >= 70 ? 'Shared' : 'Review',
      tone: readinessPercent >= 70 ? 'info' : 'neutral',
      href: '/app/i/profile?profileView=full&tab=visibility',
    },
  ];

  const walletSummary = [
    `${proofRecords.length} live signals`,
    `${metrics.verifiedSkills} verified`,
    `${metrics.pendingVerifications} pending`,
    readinessPercent >= 80 ? 'Share-ready' : 'Private by default',
  ];

  const pendingItems = [
    {
      icon: FileCheck2,
      title: hasProof ? 'Proof Pack review' : 'First proof artifact',
      detail: hasProof ? 'Check context and visibility' : 'Upload or link one real piece of work',
      action: hasProof ? 'Review status' : 'Add proof',
      href: '/app/i/profile?profileView=full&tab=proof_packs',
    },
    {
      icon: ShieldCheck,
      title: 'Trust anchor',
      detail:
        metrics.pendingVerifications > 0
          ? `${metrics.pendingVerifications} verification request${metrics.pendingVerifications === 1 ? '' : 's'} pending`
          : 'Ask one credible person or source to confirm the proof',
      action: metrics.pendingVerifications > 0 ? 'View request' : 'Request',
      href: '/app/i/verifications',
    },
  ];

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

  const stateItems = [
    {
      title: 'Profile shell is active',
      detail: 'The next useful move is adding evidence, not more navigation.',
    },
    {
      title: hasProof ? 'Proof Pack present' : 'Proof Pack not added yet',
      detail: hasProof ? 'Review visibility before sharing' : 'Start with one strong artifact',
    },
    {
      title: hasMatchingMotion ? 'Matching corridor active' : 'Matching waits for trust',
      detail: hasMatchingMotion
        ? `${metrics.qualifiedMatches} qualified match signal`
        : 'Keep privacy first',
    },
  ];

  const privacyFeatures = [
    {
      icon: LockKeyhole,
      title: 'Encrypted and secure',
      detail: 'Proof data stays protected by default.',
    },
    {
      icon: Users,
      title: "You're in control",
      detail: 'Review and manage consent whenever you want.',
    },
    {
      icon: Eye,
      title: 'Shared with purpose',
      detail: 'Only share what is needed and traceable.',
    },
  ];

  return (
    <AppSurface density="comfortable" className="bg-[#f7f2ea]">
      <div className="flex flex-col gap-5">
        <section className="rounded-lg border border-proofound-stone/70 bg-white p-4 shadow-[0_18px_54px_-46px_rgba(86,98,79,0.45)]">
          <div className="grid gap-3 lg:grid-cols-5">
            {workflowSteps.map((step, index) => (
              <Link
                key={step.label}
                href={step.href}
                className={`relative flex items-center gap-3 rounded-lg p-3 ${
                  step.active ? 'bg-[#f1f5ed]' : 'bg-transparent'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                    step.active
                      ? 'border-proofound-forest bg-proofound-forest text-white'
                      : step.complete
                        ? 'border-proofound-forest/35 bg-white text-proofound-forest'
                        : 'border-proofound-stone text-proofound-charcoal'
                  }`}
                >
                  {step.number}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-proofound-charcoal">{step.label}</p>
                  <p
                    className={`text-xs ${
                      step.complete ? 'text-proofound-forest' : 'text-muted-foreground'
                    }`}
                  >
                    {step.detail}
                  </p>
                </div>
                {index < workflowSteps.length - 1 ? (
                  <span className="ml-auto hidden h-px w-10 bg-proofound-stone lg:block" />
                ) : null}
              </Link>
            ))}
          </div>
        </section>

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
                  <Link
                    href="/app/i/profile?profileView=full&tab=visibility"
                    className="text-sm font-medium text-proofound-forest underline-offset-4 hover:underline"
                  >
                    View details
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
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
                  <Link
                    href="/app/i/profile?profileView=full&tab=proof_packs"
                    className="inline-flex items-center gap-2 text-sm font-medium text-proofound-forest"
                  >
                    View all records
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2 border-b border-proofound-stone/70 px-4 py-3 text-sm">
                  {walletSummary.map((summary) => (
                    <span
                      key={summary}
                      className="rounded-md border border-proofound-stone/60 bg-[#fbf8f1] px-3 py-1 text-proofound-charcoal"
                    >
                      {summary}
                    </span>
                  ))}
                </div>
                <div className="divide-y divide-proofound-stone/70">
                  {proofRecords.map(({ icon: Icon, title, detail, status, tone, href }) => (
                    <Link
                      key={title}
                      href={href}
                      className="flex items-center gap-4 p-4 transition-colors hover:bg-[#fbf8f1]"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef3e8] text-proofound-forest">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-proofound-charcoal">{title}</p>
                        <p className="text-xs text-muted-foreground">{detail}</p>
                      </div>
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
                    Pending Items
                  </h2>
                  <Badge variant="outline">{pendingItems.length}</Badge>
                </div>
                <div className="space-y-5">
                  {pendingItems.map(({ icon: Icon, title, detail, action, href }) => (
                    <div key={title} className="flex items-center gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f2eadf] text-proofound-charcoal">
                        <Icon className="h-6 w-6" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-proofound-charcoal">{title}</p>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">{detail}</p>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={href}>{action}</Link>
                      </Button>
                    </div>
                  ))}
                </div>
                <Link
                  href="/app/i/verifications"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-proofound-forest"
                >
                  View all pending
                  <ArrowRight className="h-4 w-4" />
                </Link>
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
                Improve readiness
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-lg border border-proofound-stone/70 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl font-medium text-proofound-charcoal">
                  Current State
                </h2>
                <Link
                  href="/app/i/profile?profileView=full"
                  className="text-sm font-medium text-proofound-forest"
                >
                  Open profile
                </Link>
              </div>
              <div className="space-y-4">
                {stateItems.map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dff0d9] text-proofound-forest">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-proofound-charcoal">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className="rounded-lg border border-proofound-stone/70 bg-white p-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(260px,0.9fr)_1fr_1fr_1fr]">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-proofound-forest text-white">
                <LockKeyhole className="h-8 w-8" />
              </span>
              <div>
                <h2 className="font-display text-xl font-medium text-proofound-charcoal">
                  Privacy by design. Trust by default.
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  You decide what to share, with whom, and for how long.
                </p>
              </div>
            </div>
            {privacyFeatures.map(({ icon: Icon, title, detail }) => (
              <div key={title} className="flex gap-3">
                <span className="mt-1 text-proofound-charcoal">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-proofound-charcoal">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
                  <Link
                    href="/app/i/settings"
                    className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-proofound-forest"
                  >
                    Learn more
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppSurface>
  );
}
