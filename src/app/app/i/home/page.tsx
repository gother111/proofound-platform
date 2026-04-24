import { requireAuth } from '@/lib/auth';
import Link from 'next/link';
import { ReadinessSprintPanel } from '@/components/dashboard/ReadinessSprintPanel';
import { Button } from '@/components/ui/button';
import { getDashboardMetrics } from '@/lib/dashboard/metrics';
import {
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle2,
  Eye,
  FileCheck2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export const dynamic = 'force-dynamic';

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
  const readinessLabel =
    readinessPercent >= 80
      ? 'Portfolio close'
      : hasProof
        ? 'Proof in progress'
        : 'First proof next';

  const heroStats = [
    {
      label: 'Portfolio readiness',
      value: `${metrics.portfolioReadinessPercent}%`,
      helper: 'Public-safe state',
    },
    {
      label: 'Verified skills',
      value: String(metrics.verifiedSkills),
      helper: 'Accepted trust',
    },
    {
      label: 'Pending reviews',
      value: String(metrics.pendingVerifications),
      helper: 'Needs follow-up',
    },
  ];

  const readinessSteps = [
    {
      label: 'Safe shell',
      detail: 'Profile basics',
      complete: readinessPercent > 0,
    },
    {
      label: 'Proof attached',
      detail: hasProof
        ? `${metrics.proofStoriesCount} proof-backed signal${metrics.proofStoriesCount === 1 ? '' : 's'}`
        : 'Add first proof',
      complete: hasProof,
      href: '/app/i/profile?profileView=full&tab=proof_packs',
    },
    {
      label: 'Trust anchor',
      detail:
        metrics.verifiedSkills > 0
          ? `${metrics.verifiedSkills} verified`
          : metrics.pendingVerifications > 0
            ? `${metrics.pendingVerifications} pending`
            : 'Request review',
      complete: metrics.verifiedSkills > 0,
      href: '/app/i/verifications',
    },
    {
      label: 'Portfolio',
      detail: readinessPercent >= 70 ? 'Share-ready soon' : 'Visibility review',
      complete: readinessPercent >= 70,
      href: '/app/i/profile?profileView=full&tab=visibility',
    },
    {
      label: 'Intro corridor',
      detail: hasMatchingMotion ? `${metrics.qualifiedMatches} qualified` : 'Opens after trust',
      complete: hasMatchingMotion,
      href: '/app/i/matching',
    },
  ];

  const proofSignals = [
    {
      icon: FileCheck2,
      label: 'Proof Packs',
      value: String(metrics.proofStoriesCount),
      description: hasProof
        ? 'Structured evidence is present. Keep outcomes and visibility current.'
        : 'Start with one real artifact, link, credential, or case study.',
      href: '/app/i/profile?profileView=full&tab=proof_packs',
    },
    {
      icon: ShieldCheck,
      label: 'Verification',
      value: String(metrics.pendingVerifications),
      description:
        metrics.pendingVerifications > 0
          ? 'Pending reviews are visible so they do not disappear into the background.'
          : 'Request one non-self trust anchor when the proof is ready.',
      href: '/app/i/verifications',
    },
    {
      icon: Eye,
      label: 'Visibility',
      value: `${readinessPercent}%`,
      description: 'Public portfolio controls stay separate from blind review surfaces.',
      href: '/app/i/profile?profileView=full&tab=visibility',
    },
  ];

  return (
    <AppSurface density="spacious" className="bg-[#f7f2ea]">
      <section className="overflow-hidden rounded-[2rem] border border-proofound-stone/70 bg-[#fbf8f1] shadow-[0_24px_70px_-44px_rgba(86,98,79,0.45)]">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="space-y-8 p-6 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant="outline"
                className="border-proofound-forest/20 bg-white/60 text-proofound-forest"
              >
                Individual proof cockpit
              </Badge>
              <span className="text-sm text-muted-foreground">Welcome back, {firstName}</span>
            </div>

            <div className="max-w-3xl space-y-4">
              <h1 className="text-4xl font-medium leading-[1.05] text-proofound-charcoal md:text-6xl">
                Make one piece of real work easier to trust.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Your home page now centers the proof journey: attach real work, request the right
                trust anchor, publish safely, then move into introductions only when the signal is
                ready.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="justify-between bg-proofound-forest px-6 text-white"
                asChild
              >
                <Link href="/app/i/profile?profileView=full&tab=proof_packs">
                  {primaryProofLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/50" asChild>
                <Link href="/app/i/profile?profileView=full&tab=visibility">Review visibility</Link>
              </Button>
            </div>
          </div>

          <aside className="border-t border-proofound-stone/70 bg-white/45 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current state</p>
                  <p className="mt-1 text-3xl font-semibold text-proofound-charcoal">
                    {readinessLabel}
                  </p>
                </div>
                <Badge className="bg-proofound-forest text-white">{readinessPercent}%</Badge>
              </div>

              <Progress
                value={readinessPercent}
                aria-label="Portfolio readiness"
                className="h-2 bg-proofound-stone/45"
                indicatorClassName="bg-proofound-forest"
              />

              <div className="grid grid-cols-3 gap-3">
                {heroStats.map(({ label, value, helper }) => (
                  <div
                    key={label}
                    className="min-w-0 rounded-2xl border border-proofound-stone/60 bg-[#fbf8f1] p-3"
                  >
                    <p className="text-2xl font-semibold text-proofound-charcoal">{value}</p>
                    <p className="mt-1 text-xs font-medium text-proofound-charcoal">{label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-proofound-stone/70 bg-[#f7f2ea] p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-proofound-charcoal">
                  <LockKeyhole className="h-4 w-4 text-proofound-forest" />
                  Privacy stays deliberate
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Public portfolio visibility does not weaken blind review or reveal private fields
                  inside organization matching.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section aria-label="Readiness path" className="grid gap-3 md:grid-cols-5">
        {readinessSteps.map((step, index) => {
          const content = (
            <div
              className={`group flex h-full min-h-[116px] flex-col justify-between rounded-2xl border p-4 transition-all ${
                step.complete
                  ? 'border-proofound-forest/25 bg-white shadow-[0_16px_36px_-28px_rgba(86,98,79,0.55)]'
                  : 'border-proofound-stone/65 bg-white/55'
              } ${step.href ? 'hover:-translate-y-0.5 hover:border-proofound-forest/45' : ''}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-muted-foreground">Step {index + 1}</span>
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
          );

          return step.href ? (
            <Link
              key={step.label}
              href={step.href}
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
            >
              {content}
            </Link>
          ) : (
            <div key={step.label}>{content}</div>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="rounded-[1.75rem] border border-proofound-stone/70 bg-white p-6 shadow-[0_18px_48px_-38px_rgba(86,98,79,0.5)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-proofound-forest">
                <Sparkles className="h-4 w-4" />
                One good next move
              </p>
              <h2 className="mt-3 text-3xl font-medium leading-tight text-proofound-charcoal">
                {hasProof ? 'Strengthen the proof you already have.' : 'Start with one real proof.'}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                {hasProof
                  ? 'Review the strongest Proof Pack, confirm it has context, and send the next verification request before opening more matching work.'
                  : 'A single anchored artifact is more useful than a long profile. Add one proof, connect it to context, then decide what can be public.'}
              </p>
            </div>
            <Button asChild className="shrink-0">
              <Link href="/app/i/profile?profileView=full&tab=proof_packs">
                {primaryProofLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#f7f2ea] p-4">
              <Briefcase className="h-5 w-5 text-proofound-forest" />
              <p className="mt-3 text-sm font-semibold text-proofound-charcoal">
                Context before claim
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Keep proof attached to work, learning, or volunteering context.
              </p>
            </div>
            <div className="rounded-2xl bg-[#f7f2ea] p-4">
              <ShieldCheck className="h-5 w-5 text-proofound-forest" />
              <p className="mt-3 text-sm font-semibold text-proofound-charcoal">
                Trust before intro
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                One non-self trust anchor is the next confidence builder.
              </p>
            </div>
            <div className="rounded-2xl bg-[#f7f2ea] p-4">
              <Eye className="h-5 w-5 text-proofound-forest" />
              <p className="mt-3 text-sm font-semibold text-proofound-charcoal">
                Visibility by choice
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Public sharing stays separate from review-stage privacy.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {proofSignals.map(({ icon: Icon, label, value, description, href }) => (
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
                <span className="shrink-0 text-2xl font-semibold text-proofound-charcoal">
                  {value}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section data-tour="dashboard" className="grid gap-4 md:grid-cols-3">
        <Card className="border-proofound-stone/60 bg-white/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-proofound-forest" />
              Public portfolio
            </CardTitle>
            <CardDescription>
              A public-safe proof surface derived from your Proof Packs and ready to share when you
              choose.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              {metrics.proofStoriesCount} proof-backed signal
              {metrics.proofStoriesCount === 1 ? '' : 's'} currently support the portfolio.
            </p>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/app/i/profile?profileView=full&tab=visibility">
                Review portfolio visibility
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-proofound-stone/60 bg-white/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-proofound-forest" />
              Qualified introductions
            </CardTitle>
            <CardDescription>
              Matching stays secondary and privacy-safe until your trust state is ready.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              {metrics.qualifiedMatches} aligned match
              {metrics.qualifiedMatches === 1 ? '' : 'es'} currently sit inside the corridor.
            </p>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/app/i/matching">
                Review matching
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-proofound-stone/60 bg-white/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-proofound-forest" />
              Interviews and reflections
            </CardTitle>
            <CardDescription>
              Keep interviews and follow-through visible without reopening archived wellbeing
              surfaces.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              {metrics.activeIntroductions} active intro
              {metrics.activeIntroductions === 1 ? '' : 's'} currently need follow-through.
            </p>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/app/i/interviews">
                Open interviews
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <ReadinessSprintPanel />
    </AppSurface>
  );
}
