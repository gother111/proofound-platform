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
  ChevronRight,
} from 'lucide-react';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { log } from '@/lib/log';

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
    log.error('individual.home.metrics_load_failed', { error });
    // Fallback to default values if metrics fail to load
    metrics = {
      proofStoriesCount: 0,
      verifiedSkills: 0,
      pendingVerifications: 0,
      qualifiedMatches: 0,
      activeIntroductions: 0,
    };
  }

  const userName = user.displayName?.trim() || user.handle?.trim() || null;
  const firstName = userName?.split(' ')[0] ?? null;
  const hasProof = metrics.proofStoriesCount > 0;
  const hasTrustAnchor = metrics.verifiedSkills > 0;

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
          ? 'Verification accepted'
          : metrics.pendingVerifications > 0
            ? 'Verification in review'
            : 'Verification missing',
      detail:
        metrics.verifiedSkills > 0
          ? `${metrics.verifiedSkills} accepted verification${metrics.verifiedSkills === 1 ? '' : 's'} attached to your proof.`
          : metrics.pendingVerifications > 0
            ? `${metrics.pendingVerifications} verification request${metrics.pendingVerifications === 1 ? '' : 's'} pending`
            : 'Nothing is exposed yet. Add one trusted source when you are ready.',
      action: metrics.pendingVerifications > 0 ? 'View request' : 'Plan verification',
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
      title: hasProof ? 'Public Page visibility review' : 'Public Page not ready yet',
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
      href: '/app/i/settings/privacy#privacy-delete',
    },
    {
      icon: History,
      title: 'Account history',
      href: '/app/i/settings/audit-log',
    },
  ];

  return (
    <AppSurface density="comfortable" className="bg-[#f7f2ea]">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-proofound-stone/50 pb-5">
          <div className="space-y-1">
            <h1 className="font-display text-3xl font-semibold text-proofound-charcoal dark:text-foreground">
              {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              {hasProof
                ? 'Your proof records are structured. Review your verified skills and Public Page visibility before assignment review opens.'
                : 'Start by creating your first proof record. Shaping a single trusted work sample or artifact makes your profile ready.'}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'self-start md:self-auto font-medium px-3 py-1 shrink-0',
              hasProof
                ? 'border-proofound-forest/30 bg-[#eef3e8] text-proofound-forest'
                : 'border-proofound-stone/50 bg-[#fbf8f1] text-[#8a5b00]'
            )}
          >
            {hasProof ? 'Ready to Share' : 'Setup Required'}
          </Badge>
        </div>

        {/* Bento Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column: Readiness Checklist */}
          <div className="md:col-span-2 space-y-4">
            <Card variant="bento" className="p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-proofound-stone/30 pb-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-proofound-charcoal">
                    Readiness corridor
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Steps required before assignment reviews can open
                  </p>
                </div>
                {unresolvedReadinessSteps > 0 ? (
                  <Badge
                    variant="outline"
                    className="border-amber-700/40 bg-amber-50 text-amber-900"
                  >
                    {unresolvedReadinessSteps} action{unresolvedReadinessSteps === 1 ? '' : 's'}{' '}
                    remaining
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-proofound-forest/30 text-proofound-forest bg-proofound-forest/5"
                  >
                    All steps complete
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                {readinessSteps.map((step, idx) => {
                  const StepIcon = step.icon;
                  const classes = readinessStateClasses(step.state);
                  return (
                    <div
                      key={idx}
                      className="group relative flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-xl border border-proofound-stone/30 bg-[#fdfdfd] transition-all hover:bg-white hover:shadow-sm"
                    >
                      {/* Icon & Status (Mobile/Desktop adaptive) */}
                      <div className="flex items-center sm:items-start gap-3 sm:gap-0 shrink-0">
                        <div
                          className={cn(
                            'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                            classes.icon
                          )}
                        >
                          <StepIcon className="h-5 w-5" />
                        </div>
                        <div className="sm:hidden flex-1">
                          <span className="font-semibold text-proofound-charcoal text-sm">
                            {step.title}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-2 sm:space-y-1 min-w-0">
                        <div className="hidden sm:flex items-center justify-between gap-4">
                          <h3 className="font-semibold text-proofound-charcoal text-sm">
                            {step.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] px-2 py-0.5 uppercase tracking-wider font-semibold border-none',
                              classes.pill
                            )}
                          >
                            {step.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed sm:max-w-[85%]">
                          {step.detail}
                        </p>
                        <div className="flex sm:hidden items-center justify-between gap-2 pt-2 border-t border-proofound-stone/20">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] px-2 py-0.5 uppercase tracking-wider font-semibold border-none',
                              classes.pill
                            )}
                          >
                            {step.status}
                          </Badge>
                          <Button
                            variant="link"
                            className="-mr-3 flex min-h-11 items-center gap-1 rounded-md px-3 py-2 text-xs font-semibold text-proofound-forest hover:bg-proofound-forest/5 hover:text-proofound-forest/80 focus-visible:ring-proofound-forest"
                            asChild
                          >
                            <Link href={step.href}>
                              {step.action}
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </div>

                      {/* Desktop Action */}
                      <div className="hidden sm:flex shrink-0 self-center">
                        <Button
                          variant="outline"
                          size="touch"
                          className="min-h-11 border-proofound-stone text-xs font-medium text-proofound-charcoal hover:bg-proofound-forest/5"
                          asChild
                        >
                          <Link href={step.href}>
                            {step.action}
                            <ArrowRight className="h-3 w-3 ml-1.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Main Guided Action */}
              <div className="pt-4 border-t border-proofound-stone/30">
                <Button
                  className="w-full justify-between bg-proofound-forest px-6 py-5 text-white hover:bg-proofound-forest/90 rounded-xl"
                  asChild
                >
                  <Link href={hasProof ? '/app/i/profile?profileView=full' : '/app/i/profile'}>
                    <span>
                      {hasProof ? 'Review my Proof Packs' : 'Begin guided portfolio setup'}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Column: Trust Controls & Notices */}
          <div className="space-y-6">
            <Card variant="bento" className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-proofound-charcoal">
                  Trust & privacy controls
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Manage visibility, export, and assignment-review access
                </p>
              </div>

              <div className="divide-y divide-proofound-stone/30">
                {trustControls.map((ctrl, idx) => {
                  const CtrlIcon = ctrl.icon;
                  return (
                    <Link
                      key={idx}
                      href={ctrl.href}
                      className="flex items-center justify-between py-3 text-proofound-charcoal hover:text-proofound-forest group first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-proofound-stone/20 text-proofound-charcoal flex items-center justify-center shrink-0 group-hover:bg-proofound-forest/5 group-hover:text-proofound-forest">
                          <CtrlIcon className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-medium truncate">{ctrl.title}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-proofound-forest" />
                    </Link>
                  );
                })}
              </div>
            </Card>

            <div className="flex items-start gap-3 rounded-2xl bg-[#fbf8f1] p-5 border border-proofound-stone/40">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-proofound-forest" />
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-proofound-charcoal">
                  Private-first corridor
                </h4>
                <p className="text-[11px] leading-relaxed text-proofound-charcoal">
                  Your profile and evidence stay private by default. Organizations only see
                  privacy-safe proof summaries until you explicitly approve a reveal request.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppSurface>
  );
}
