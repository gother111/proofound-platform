import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Briefcase, Building2, Globe2, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { ShareLinkButton } from '../../[handle]/ShareLinkButton';

const FALLBACK_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

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
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

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

  const [activeAssignmentsResult, teamMembersResult] = await Promise.all([
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
  ]);

  const values = toValueLabels(organization.values);
  const causes = Array.isArray(organization.causes)
    ? organization.causes.filter((cause): cause is string => typeof cause === 'string').slice(0, 6)
    : [];

  const shareUrl = `${FALLBACK_URL.replace(/\/$/, '')}/portfolio/org/${slug}`;
  const activeAssignments = activeAssignmentsResult.count ?? 0;
  const teamMembers = teamMembersResult.count ?? 0;

  return (
    <div className="min-h-screen bg-proofound-parchment">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
        <Card>
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
              <ShareLinkButton url={shareUrl} />
              {organization.website ? (
                <a
                  href={organization.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-[#D9D5CC] bg-white px-3 py-2 text-sm text-[#2D3330]"
                >
                  <Globe2 className="h-4 w-4" />
                  Website
                </a>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#2D3330]">
                {organization.mission || 'Mission statement is not published yet.'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Trust Summary</CardTitle>
              <Badge variant="outline" className="gap-1">
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
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Values and Causes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-[#2D3330]">Values</p>
              {values.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {values.map((value) => (
                    <Badge key={value} variant="secondary">
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
                    <Badge key={cause} variant="outline">
                      {cause}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#6B6760]">No public causes listed yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
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
