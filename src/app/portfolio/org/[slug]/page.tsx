import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { GlassCard } from '@/components/ui/glass-card';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { FadeIn } from '@/components/ui/fade-in';
import { SlideUp } from '@/components/ui/slide-up';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Globe2,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { sanitizeReturnPath } from '@/lib/navigation/sanitize-return-path';
import {
  buildPublicProfileMetadata,
  buildUnavailablePublicProfileMetadata,
} from '@/lib/seo/public-profile-metadata';
import { ShareLinkButton } from '../../[handle]/ShareLinkButton';
import { DownloadOrganizationPdfButton } from './DownloadOrganizationPdfButton';

const FALLBACK_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const safePath = `/portfolio/org/${encodeURIComponent(slug)}`;

  try {
    const supabase = await createClient();
    const { data: organization } = await supabase
      .from('organizations')
      .select('slug, display_name, tagline')
      .eq('slug', slug)
      .maybeSingle();

    if (!organization) {
      return buildUnavailablePublicProfileMetadata(safePath);
    }

    const displayName = organization.display_name || organization.slug || 'Proofound Organization';
    const tagline =
      typeof organization.tagline === 'string' && organization.tagline.trim().length > 0
        ? organization.tagline.trim()
        : null;

    return buildPublicProfileMetadata({
      title: `${displayName} | Proofound Organization Portfolio`,
      description: tagline
        ? `${displayName} on Proofound. ${tagline}`
        : `Explore ${displayName}'s public organization portfolio on Proofound.`,
      path: safePath,
      ogTitle: `${displayName} on Proofound`,
      ogDescription: tagline
        ? `${tagline} View this public organization profile on Proofound.`
        : `View ${displayName}'s public organization profile on Proofound.`,
    });
  } catch {
    return buildUnavailablePublicProfileMetadata(safePath);
  }
}

function toValueLabels(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }
      if (item && typeof item === 'object' && 'label' in item) {
        const label = (item as { label?: unknown }).label;
        return typeof label === 'string' ? label : null;
      }
      return null;
    })
    .filter((item): item is string => Boolean(item))
    .slice(0, 6);
}

export default async function OrganizationPortfolioPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ returnTo?: string | string[] }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const returnPath = sanitizeReturnPath(resolvedSearchParams.returnTo, '/');
  const returnLabel = returnPath.startsWith('/app/') ? 'Return to menu' : 'Return home';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: organization } = await supabase
    .from('organizations')
    .select(
      `
        id,
        slug,
        display_name,
        tagline,
        mission,
        website,
        type,
        values,
        causes,
        verified
      `
    )
    .eq('slug', slug)
    .maybeSingle();

  if (!organization) {
    return notFound();
  }

  const [activeAssignmentsResult, teamMembersResult, membershipResult] = await Promise.all([
    supabase
      .from('assignments')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', organization.id)
      .eq('status', 'active'),
    supabase
      .from('organization_members')
      .select('user_id', { count: 'exact', head: true })
      .eq('org_id', organization.id)
      .eq('status', 'active'),
    user?.id
      ? supabase
          .from('organization_members')
          .select('user_id', { count: 'exact', head: true })
          .eq('org_id', organization.id)
          .eq('user_id', user.id)
          .eq('status', 'active')
      : Promise.resolve({ count: 0 }),
  ]);

  const values = toValueLabels(organization.values);
  const causes = Array.isArray(organization.causes)
    ? organization.causes.filter((cause): cause is string => typeof cause === 'string').slice(0, 6)
    : [];

  const shareUrl = `${FALLBACK_URL.replace(/\/$/, '')}/portfolio/org/${slug}`;
  const activeAssignments = activeAssignmentsResult.count ?? 0;
  const teamMembers = teamMembersResult.count ?? 0;
  const viewerIsMember = Boolean(membershipResult.count && membershipResult.count > 0);

  return (
    <AppSurface
      withBackground={false}
      density="comfortable"
      className="min-h-screen bg-gradient-to-b from-[#F7F6F1] via-[#FBFAF6] to-white"
    >
      <FadeIn duration={0.6}>
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <SlideUp delay={0.1}>
            <GlassCard className="border-[#E8E6DD] bg-white/95 shadow-sm">
              <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1C4D3A] text-white">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-semibold text-[#2D3330]">
                          {organization.display_name}
                        </h1>
                        {organization.verified ? (
                          <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                            <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                            Verified
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-[#6B6760]">Public organization portfolio</p>
                    </div>
                  </div>

                  {organization.tagline ? (
                    <p className="text-sm text-[#2D3330]">{organization.tagline}</p>
                  ) : (
                    <p className="text-sm text-[#6B6760]">
                      Purpose-led organization profile and active opportunities.
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={returnPath} className="inline-flex items-center gap-1.5">
                      <ArrowLeft className="h-4 w-4" />
                      {returnLabel}
                    </Link>
                  </Button>
                  <ShareLinkButton url={shareUrl} />
                  {viewerIsMember ? <DownloadOrganizationPdfButton slug={slug} /> : null}
                  {organization.website ? (
                    <a
                      href={organization.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border border-[#D9D5CC] bg-[#FCFBF8] px-3 py-2 text-sm text-[#2D3330] transition-colors hover:border-[#1C4D3A]/40 hover:text-[#1C4D3A]"
                    >
                      <Globe2 className="h-4 w-4" />
                      Website
                    </a>
                  ) : null}
                </div>
              </CardContent>
            </GlassCard>
          </SlideUp>

          <div className="grid gap-4 md:grid-cols-2">
            <SlideUp delay={0.2}>
              <GlassCard className="h-full border-[#E8E6DD] bg-white/95">
                <CardHeader>
                  <CardTitle className="text-lg">Mission</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#2D3330]">
                    {organization.mission || 'Mission statement is not published yet.'}
                  </p>
                </CardContent>
              </GlassCard>
            </SlideUp>

            <SlideUp delay={0.3}>
              <GlassCard className="h-full border-[#E8E6DD] bg-white/95">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Trust Summary</CardTitle>
                  <Badge variant="outline" className="gap-1 border-[#D9D5CC] text-[#6B6760]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Lean MVP
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-[#2D3330]">
                  <SummaryItem
                    label="Active assignments"
                    value={activeAssignments}
                    icon={<Briefcase className="h-4 w-4 text-[#1C4D3A]" />}
                  />
                  <Separator />
                  <SummaryItem
                    label="Team members"
                    value={teamMembers}
                    icon={<Users className="h-4 w-4 text-[#1C4D3A]" />}
                  />
                  <Separator />
                  <SummaryItem
                    label="Organization type"
                    value={organization.type || 'not specified'}
                    icon={<Building2 className="h-4 w-4 text-[#1C4D3A]" />}
                  />
                </CardContent>
              </GlassCard>
            </SlideUp>
          </div>

          <SlideUp delay={0.4}>
            <GlassCard className="border-[#E8E6DD] bg-white/95">
              <CardHeader>
                <CardTitle className="text-lg">Values and Causes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-medium text-[#2D3330]">Values</p>
                  {values.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {values.map((value) => (
                        <Badge
                          key={value}
                          variant="secondary"
                          className="bg-[#F7F6F1] text-[#2D3330]"
                        >
                          {value}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#6B6760]">No public values listed yet.</p>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-[#2D3330]">Causes</p>
                  {causes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {causes.map((cause) => (
                        <Badge key={cause} variant="outline" className="border-[#D9D5CC]">
                          {cause}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#6B6760]">No public causes listed yet.</p>
                  )}
                </div>
              </CardContent>
            </GlassCard>
          </SlideUp>
        </div>
      </FadeIn>
    </AppSurface>
  );
}

function SummaryItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-[#2D3330]">{label}</span>
      </div>
      <span className="rounded-full bg-[#F7F6F1] px-3 py-1 text-sm font-medium text-[#2D3330]">
        {value}
      </span>
    </div>
  );
}
