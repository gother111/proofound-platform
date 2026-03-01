import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, Globe2, ShieldCheck, Users, Briefcase } from 'lucide-react';
import { sanitizeReturnPath } from '@/lib/navigation/sanitize-return-path';
import {
  buildPublicProfileMetadata,
  buildUnavailablePublicProfileMetadata,
} from '@/lib/seo/public-profile-metadata';
import { PublicProfileSection } from '@/components/public-profile/PublicProfileSection';
import { PublicProfileShell } from '@/components/public-profile/PublicProfileShell';
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
      .select('slug, display_name, tagline, mission')
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
    const mission =
      typeof organization.mission === 'string' && organization.mission.trim().length > 0
        ? organization.mission.trim()
        : null;

    return buildPublicProfileMetadata({
      title: `${displayName} | Proofound Organization Portfolio`,
      description:
        tagline ||
        mission ||
        `Explore ${displayName}'s public organization portfolio on Proofound.`,
      path: safePath,
      ogTitle: `${displayName} on Proofound`,
      ogDescription:
        tagline || mission || `View ${displayName}'s public organization profile on Proofound.`,
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
    <PublicProfileShell
      maxWidthClassName="max-w-5xl"
      header={
        <div className="space-y-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-proofound-forest text-white">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-semibold text-foreground">
                      {organization.display_name}
                    </h1>
                    {organization.verified ? (
                      <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                        <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                        Verified
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">Public organization portfolio</p>
                </div>
              </div>
              <p className="text-sm text-foreground">
                {organization.tagline ||
                  'Purpose-led organization profile and active opportunities.'}
              </p>
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
                  className="inline-flex items-center gap-2 rounded-md border border-[#D9D5CC] bg-[#FCFBF8] px-3 py-2 text-sm text-foreground hover:border-proofound-forest/40 hover:text-proofound-forest"
                >
                  <Globe2 className="h-4 w-4" />
                  Website
                </a>
              ) : null}
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between">
          <span>proofound.io/portfolio/org/{slug}</span>
          <span>Organization public profile</span>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-4">
          <PublicProfileSection title="Organization">
            <div className="space-y-2">
              <p className="text-sm text-foreground">
                {organization.display_name || 'Organization profile'}
              </p>
              {organization.tagline ? (
                <p className="text-sm text-muted-foreground">{organization.tagline}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {organization.type ? (
                  <span className="rounded-full border border-[#D9D5CC] bg-japandi-bg px-2.5 py-1 text-xs text-foreground capitalize">
                    {organization.type}
                  </span>
                ) : null}
                {organization.verified ? (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
                    Verified
                  </span>
                ) : null}
              </div>
            </div>
          </PublicProfileSection>

          <PublicProfileSection title="Mission">
            <p className="whitespace-pre-line text-sm leading-6 text-foreground">
              {organization.mission || 'Mission statement is not published yet.'}
            </p>
          </PublicProfileSection>

          <PublicProfileSection title="Values & causes">
            <div className="space-y-3">
              <div>
                <p className="mb-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                  Values
                </p>
                {values.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {values.map((value) => (
                      <span
                        key={value}
                        className="rounded-full border border-[#D9D5CC] bg-japandi-bg px-2.5 py-1 text-xs text-foreground"
                      >
                        {value}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No public values listed yet.</p>
                )}
              </div>
              <div>
                <p className="mb-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                  Causes
                </p>
                {causes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {causes.map((cause) => (
                      <span
                        key={cause}
                        className="rounded-full border border-[#D9D5CC] bg-japandi-bg px-2.5 py-1 text-xs text-foreground"
                      >
                        {cause}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No public causes listed yet.</p>
                )}
              </div>
            </div>
          </PublicProfileSection>
        </div>

        <div className="space-y-4">
          <PublicProfileSection title="Trust summary">
            <div className="space-y-2">
              <SummaryItem
                label="Active assignments"
                value={activeAssignments}
                icon={<Briefcase className="h-4 w-4 text-proofound-forest" />}
              />
              <SummaryItem
                label="Team members"
                value={teamMembers}
                icon={<Users className="h-4 w-4 text-proofound-forest" />}
              />
              <SummaryItem
                label="Organization type"
                value={organization.type || 'not specified'}
                icon={<Building2 className="h-4 w-4 text-proofound-forest" />}
              />
            </div>
          </PublicProfileSection>

          <PublicProfileSection title="Links">
            <div className="space-y-2 text-sm">
              <p className="break-all text-foreground">{shareUrl}</p>
              {organization.website ? (
                <a
                  href={organization.website}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-proofound-forest hover:underline"
                >
                  {organization.website}
                </a>
              ) : (
                <p className="text-muted-foreground">No public website listed.</p>
              )}
            </div>
          </PublicProfileSection>
        </div>
      </div>
    </PublicProfileShell>
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
    <div className="flex items-center justify-between gap-3 rounded-md border border-proofound-stone bg-white px-3 py-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-foreground">{label}</span>
      </div>
      <span className="rounded-full bg-japandi-bg px-2.5 py-0.5 text-sm font-semibold text-foreground">
        {value}
      </span>
    </div>
  );
}
