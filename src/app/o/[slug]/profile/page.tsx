import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { Progress } from '@/components/ui/progress';
import { getOrgBySlug, getViewerOrgMembership, viewerCanEditOrg } from '@/features/org/data';
import { OrgBasicCard } from '@/features/org/profile/OrgBasicCard';
import { OrgTagline } from '@/features/org/profile/OrgTagline';
import { OrgVerifications } from '@/features/org/profile/OrgVerifications';
import { OrgCauses } from '@/features/org/profile/OrgCauses';
import { OrgImpactPipeline } from '@/features/org/profile/OrgImpactPipeline';
import { OrgMissionVision } from '@/features/org/profile/OrgMissionVision';
import { OrgCoreValues } from '@/features/org/profile/OrgCoreValues';
import { OrgCommitments } from '@/features/org/profile/OrgCommitments';

function completeness(org: Record<string, unknown>) {
  const fields = [
    'logo_url',
    'tagline',
    'size',
    'industry',
    'founded_date',
    'legal_form',
    'locations',
    'mission',
    'vision',
    'core_values',
    'causes',
    'verifications',
    'impact_pipeline',
    'website_url',
  ];

  const score = fields.reduce((acc, field) => {
    const value = org[field];
    let filled = false;

    if (Array.isArray(value)) {
      filled = value.length > 0;
    } else if (value && typeof value === 'object') {
      filled = Object.keys(value as Record<string, unknown>).length > 0;
    } else if (typeof value === 'string') {
      filled = value.trim().length > 0;
    } else {
      filled = Boolean(value);
    }

    return acc + (filled ? 1 : 0);
  }, 0);

  return Math.round((score / fields.length) * 100);
}

export default async function OrganizationProfilePage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const user = await requireAuth();
  const org = await getOrgBySlug(slug);

  if (!org) {
    notFound();
  }

  const membership = await getViewerOrgMembership(org.id, user.id);
  const canEdit = viewerCanEditOrg(membership?.role);
  const pct = completeness(org as Record<string, unknown>);

  return (
    <div className="space-y-8">
      <div className="rounded-xl border bg-muted px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Welcome to Proofound!</h2>
            <p className="text-sm text-muted-foreground">
              Your organization profile is a platform for transparency, impact, and meaningful
              connections.
            </p>
          </div>
          <div className="text-sm font-medium text-muted-foreground">{pct}% complete</div>
        </div>
        <div className="mt-3">
          <Progress value={pct} />
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          Start by adding your logo, mission, and core values
        </div>
      </div>

      <OrgBasicCard org={org} orgId={org.id} canEdit={canEdit} />
      <OrgTagline orgId={org.id} tagline={org.tagline ?? null} canEdit={canEdit} />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <OrgVerifications orgId={org.id} verifications={org.verifications} canEdit={canEdit} />
          <OrgCauses orgId={org.id} causes={org.causes ?? []} canEdit={canEdit} />
        </div>
        <OrgImpactPipeline orgId={org.id} impactPipeline={org.impact_pipeline} canEdit={canEdit} />
      </div>

      <OrgMissionVision
        orgId={org.id}
        mission={org.mission ?? null}
        vision={org.vision ?? null}
        canEdit={canEdit}
      />

      <OrgCoreValues orgId={org.id} coreValues={org.core_values} canEdit={canEdit} />

      <OrgCommitments orgId={org.id} commitments={org.commitments} canEdit={canEdit} />
    </div>
  );
}
