import { requireAuth } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getDashboardMetrics } from '@/lib/dashboard/metrics';
import {
  ArrowRight,
  Briefcase,
  Download,
  Eye,
  FileCheck2,
  History,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

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
      proofStoriesCount: 0,
      verifiedSkills: 0,
      pendingVerifications: 0,
      qualifiedMatches: 0,
      activeIntroductions: 0,
    };
  }

  const userName = user.displayName || user.handle || 'there';
  const firstName = userName.split(' ')[0];
  const hasProof = metrics.proofStoriesCount > 0;
  const hasTrustedConfirmation = metrics.verifiedSkills > 0;
  const hasPendingTrustedConfirmation = metrics.pendingVerifications > 0;
  const primaryProofLabel = hasProof ? 'Review proof records' : 'Start proof record';
  const readinessTone = hasProof
    ? hasTrustedConfirmation
      ? 'Proof and trusted confirmation present'
      : 'Proof present; trusted confirmation is next'
    : 'Start with one proof record';

  const proofRecords = [
    {
      icon: FileCheck2,
      title: 'Proof records',
      detail: hasProof
        ? `${metrics.proofStoriesCount} proof-backed signal${metrics.proofStoriesCount === 1 ? '' : 's'}`
        : 'No proof yet. Start with one private record.',
      status: hasProof ? 'Present' : 'Pending',
      tone: hasProof ? 'info' : 'warning',
      href: '/app/i/profile?profileView=full&tab=proof_packs',
    },
    {
      icon: ShieldCheck,
      title: 'Trusted confirmations',
      detail:
        metrics.verifiedSkills > 0
          ? `${metrics.verifiedSkills} accepted trust signal${metrics.verifiedSkills === 1 ? '' : 's'}`
          : metrics.pendingVerifications > 0
            ? `${metrics.pendingVerifications} verification request${metrics.pendingVerifications === 1 ? '' : 's'} pending`
            : 'No trusted confirmation yet. You can add this after the first proof.',
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
      title: 'Public Page visibility',
      detail: hasProof
        ? 'Public-safe sharing controls'
        : 'Private by default until you choose to share',
      status: hasProof ? 'Review' : 'Locked',
      tone: hasProof ? 'info' : 'neutral',
      href: '/app/i/profile?profileView=full&tab=visibility',
    },
  ];

  const readinessSteps = [
    {
      icon: FileCheck2,
      title: hasProof ? 'Proof record is present' : 'First proof artifact',
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
          ? 'Trusted confirmation verified'
          : metrics.pendingVerifications > 0
            ? 'Trusted confirmation in review'
            : 'Trust badge self-reported',
      detail:
        metrics.verifiedSkills > 0
          ? `${metrics.verifiedSkills} accepted trust signal${metrics.verifiedSkills === 1 ? '' : 's'} attached to your proof.`
          : metrics.pendingVerifications > 0
            ? `${metrics.pendingVerifications} verification request${metrics.pendingVerifications === 1 ? '' : 's'} pending`
            : 'Publishing can start with structured proof. Add one trusted source when you want the Verified badge and introduction readiness.',
      action: metrics.pendingVerifications > 0 ? 'View request' : 'Plan confirmation',
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
      title: hasProof ? 'Portfolio visibility review' : 'Public Page not ready yet',
      detail: hasProof
        ? 'Your proof surface is ready for a final sharing pass.'
        : 'Sharing stays off by default until your first proof record is clearer.',
      action: 'Manage visibility',
      href: '/app/i/profile?profileView=full&tab=visibility',
      status: hasProof ? 'Review' : 'Locked',
      state: hasProof ? 'wait' : 'warn',
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
  const trustControls = [
    {
      icon: LockKeyhole,
      title: 'Privacy controls',
      href: '/app/i/settings/privacy',
    },
    {
      icon: Eye,
      title: 'Manage visibility',
      href: '/app/i/profile?profileView=full&tab=visibility',
    },
    {
      icon: Download,
      title: 'Export or delete',
      href: '/app/i/settings?tab=privacy',
    },
    {
      icon: History,
      title: 'Audit log',
      href: '/app/i/settings/audit-log',
    },
  ];

  const scoreItems = [
    {
      label: `${metrics.verifiedSkills} accepted trust signal${metrics.verifiedSkills === 1 ? '' : 's'}`,
      state: hasTrustedConfirmation ? 'ok' : 'warn',
    },
    {
      label: `${metrics.pendingVerifications} pending verification${metrics.pendingVerifications === 1 ? '' : 's'}`,
      state: hasPendingTrustedConfirmation ? 'warn' : 'ok',
    },
    {
      label: `${metrics.proofStoriesCount} proof item${metrics.proofStoriesCount === 1 ? '' : 's'} ready`,
      state: hasProof ? 'ok' : 'warn',
    },
    {
      label: hasProof ? 'Public Page can be reviewed' : 'Public Page waits for first proof',
      state: hasProof ? 'wait' : 'warn',
    },
  ];

  return (
    <AppSurface density="comfortable" className="bg-[#f7f2ea]">
      <div className="flex flex-col gap-6">
        <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-5">
            <div className="overflow-hidden rounded-lg border border-proofound-stone/70 bg-white shadow-[0_18px_50px_rgba(45,51,48,0.06)]">
              <div className="border-b border-proofound-stone/60 bg-[#f3f6ef] px-5 py-3">
                <Badge
                  variant="outline"
                  className="border-proofound-forest/20 bg-white/70 text-proofound-forest"
                >
                  Proof-first home
                </Badge>
              </div>
              <div className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between md:p-6">
                <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-[#dfead5] text-proofound-forest">
                    <Briefcase className="h-8 w-8" />
                  </span>
                  <div className="min-w-0">
                    <h1 className="font-display text-2xl font-medium leading-tight text-proofound-charcoal md:text-3xl">
                      {hasProof ? 'Verify strongest proof record' : 'Add your first proof record'}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                      Welcome back, {firstName}.{' '}
                      {hasProof
                        ? 'Your proof is ready for context, trust, and visibility review.'
                        : 'Start with one work sample, credential, or case study that can be trusted.'}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2 md:items-end">
                  <Button
                    className="w-full justify-between bg-proofound-forest px-6 text-white sm:w-auto"
                    asChild
                  >
                    <Link href="/app/i/profile?profileView=full&tab=proof_packs">
                      {primaryProofLabel}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid items-start gap-5 2xl:grid-cols-[1.12fr_0.88fr]">
              <div className="overflow-hidden rounded-lg border border-proofound-stone/70 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-proofound-stone/70 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-xl font-medium text-proofound-charcoal">
                      Your Proof Wallet
                    </h2>
                    <Badge variant="outline" className="bg-[#fbf8f1]">
                      {proofRecords.length} checks
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Evidence, trust, and sharing state
                  </p>
                </div>
                <div className="divide-y divide-proofound-stone/70">
                  {proofRecords.map(({ icon: Icon, title, detail, status, tone, href }) => (
                    <Link
                      key={title}
                      href={href}
                      className="flex min-h-[92px] flex-col gap-3 p-5 transition-colors hover:bg-[#fbf8f1] sm:flex-row sm:items-center sm:gap-4"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#eef3e8] text-proofound-forest">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-proofound-charcoal">{title}</p>
                          <p className="text-xs leading-5 text-muted-foreground">{detail}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 pl-14 sm:min-w-32 sm:justify-end sm:pl-0">
                        <span
                          className={`min-w-20 rounded-md px-2.5 py-1 text-center text-xs font-medium ${
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
                <div className="border-t border-proofound-stone/70 bg-[#fbf8f1]/70 p-4">
                  <Link
                    href="/app/i/profile?profileView=full&tab=proof_packs"
                    className="inline-flex items-center gap-2 text-sm font-medium text-proofound-forest"
                  >
                    Add new record
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="rounded-lg border border-proofound-stone/70 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <h2 className="font-display text-xl font-medium text-proofound-charcoal">
                    Readiness Checklist
                  </h2>
                  <Badge variant="outline">
                    {unresolvedReadinessSteps > 0
                      ? `${unresolvedReadinessSteps} to resolve`
                      : 'Ready'}
                  </Badge>
                </div>
                <div className="space-y-4">
                  {readinessSteps.map(
                    ({ icon: Icon, title, detail, action, href, status, state }) => {
                      const stateClasses = readinessStateClasses(state);

                      return (
                        <div
                          key={title}
                          className="flex flex-col gap-3 rounded-lg border border-proofound-stone/60 bg-[#fbf8f1]/55 p-3 sm:flex-row sm:items-center sm:gap-4"
                        >
                          <div className="flex min-w-0 flex-1 gap-3">
                            <span
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${stateClasses.icon}`}
                            >
                              <Icon className="h-5 w-5" />
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
                          <Button size="sm" variant="outline" className="w-full sm:w-32" asChild>
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
            <div className="rounded-lg border border-proofound-stone/70 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-xl font-medium text-proofound-charcoal">
                  Proof Readiness
                </h2>
                <span className="rounded-md bg-[#eef3e8] px-2 py-1 text-xs font-medium text-proofound-forest">
                  Checklist
                </span>
              </div>
              <p className="mt-5 text-sm leading-6 text-muted-foreground">{readinessTone}</p>
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

            <div className="rounded-lg border border-proofound-stone/70 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <h2 className="font-display text-xl font-medium text-proofound-charcoal">
                  Trust Controls
                </h2>
                <span className="rounded-md bg-[#eef3e8] px-2 py-1 text-xs font-medium text-proofound-forest">
                  Account
                </span>
              </div>
              <div className="grid gap-2">
                {trustControls.map(({ icon: Icon, title, href }) => (
                  <Link
                    key={title}
                    href={href}
                    className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-proofound-stone/60 bg-[#fbf8f1]/55 px-3 py-2 text-sm font-medium text-proofound-charcoal transition-colors hover:border-proofound-forest/30 hover:bg-[#fbf8f1]"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0 text-proofound-forest" />
                      <span className="truncate">{title}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AppSurface>
  );
}
