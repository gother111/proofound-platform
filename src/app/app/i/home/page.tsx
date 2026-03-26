import { requireAuth } from '@/lib/auth';
import Link from 'next/link';
import { ReadinessSprintPanel } from '@/components/dashboard/ReadinessSprintPanel';
import { Button } from '@/components/ui/button';
import { getDashboardMetrics } from '@/lib/dashboard/metrics';
import { ArrowRight, Briefcase, Calendar, ShieldCheck, Users } from 'lucide-react';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

  const heroStats = [
    {
      label: 'Public proof readiness',
      value: `${metrics.portfolioReadinessPercent}%`,
    },
    {
      label: 'Verified skills',
      value: String(metrics.verifiedSkills),
    },
    {
      label: 'Pending proof reviews',
      value: String(metrics.pendingVerifications),
    },
  ];

  return (
    <AppSurface>
      <div className="relative overflow-hidden rounded-3xl bg-proofound-forest text-white shadow-xl isolate">
        <div className="absolute inset-0 bg-gradient-to-br from-proofound-forest via-proofound-forest/90 to-extended-clay/60 mix-blend-multiply" />
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-white/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-extended-clay/20 blur-3xl rounded-full pointer-events-none" />

        <div className="relative p-8 md:p-12 lg:p-14 flex flex-col md:flex-row gap-8 items-start justify-between">
          <div className="max-w-3xl space-y-8">
            <h1 className="text-4xl md:text-5xl font-display font-medium tracking-tight">
              Welcome back, {firstName}
            </h1>
            <p className="text-white/80 text-lg leading-relaxed max-w-2xl">
              Proof Packs first. Public proof when you are ready. Privacy first. Calm by design.
              Keep your Proof Packs current, share a public-safe portfolio, and only move into
              qualified introductions when trust is ready.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              {heroStats.map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 bg-white/10 rounded-2xl px-5 py-3 backdrop-blur-md border border-white/10 shadow-sm"
                >
                  <div className="flex flex-col">
                    <span className="text-xs text-white/70 tracking-wide uppercase font-medium">
                      {label}
                    </span>
                    <span className="font-semibold text-xl tracking-tight mt-0.5">{value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6">
              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="bg-white text-proofound-forest hover:bg-neutral-light-50 rounded-xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md font-medium text-base h-12 px-6"
                  asChild
                >
                  <Link href="/app/i/portfolio">
                    {metrics.proofStoriesCount === 0
                      ? 'Add your first proof'
                      : 'Open portfolio workspace'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/15"
                  asChild
                >
                  <Link href="/app/i/matching">Open matching</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section data-tour="dashboard" className="grid gap-4 md:grid-cols-3">
        <Card className="border-proofound-stone/60">
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
              <Link href="/app/i/portfolio">
                Open portfolio workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-proofound-stone/60">
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

        <Card className="border-proofound-stone/60">
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
