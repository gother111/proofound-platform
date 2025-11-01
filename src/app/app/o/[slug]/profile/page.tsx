import { requireAuth, getActiveOrg, assertOrgRole } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updateOrganization } from '@/actions/org';
import { EmptyOrganizationProfileView } from '@/components/profile/EmptyOrganizationProfileView';

export const dynamic = 'force-dynamic';

export default async function OrganizationProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireAuth();
  const { slug } = await params;
  const result = await getActiveOrg(slug, user.id);

  if (!result) {
    notFound();
  }

  const { org, membership } = result;

  // Check if user can edit
  const canEdit = membership.role === 'owner' || membership.role === 'admin';

  // Check if organization profile is empty (has minimal data beyond required fields)
  const hasBasicInfo = Boolean(org.tagline || org.mission || org.vision || org.website);
  const hasBusinessDetails = Boolean(
    org.industry || org.organizationSize || org.impactArea || org.legalForm
  );
  const hasExtendedInfo = Boolean(org.values || org.workCulture || org.legalName);

  const isEmptyProfile = !hasBasicInfo && !hasBusinessDetails && !hasExtendedInfo;

  // Calculate profile completion percentage
  const completionFields = [
    org.logoUrl,
    org.tagline,
    org.mission,
    org.vision,
    org.industry,
    org.organizationSize,
    org.impactArea,
    org.legalForm,
    org.foundedDate,
    org.legalName,
    org.website,
    org.values,
    org.workCulture,
  ];
  const completedFields = completionFields.filter((field) => Boolean(field)).length;
  const profileCompletion = Math.round((completedFields / completionFields.length) * 100);

  // Show empty state if profile has minimal data
  if (isEmptyProfile) {
    return (
      <EmptyOrganizationProfileView
        organizationName={org.displayName}
        profileCompletion={Math.max(profileCompletion, 5)} // Minimum 5% for creating the org
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 min-h-screen bg-proofound-parchment dark:bg-background p-6">
      <div>
        <h1 className="text-4xl font-['Crimson_Pro'] font-semibold text-proofound-forest dark:text-primary mb-2">
          Organization Profile
        </h1>
        <p className="text-proofound-charcoal/70 dark:text-muted-foreground">
          {canEdit ? 'Update your organization information' : 'View organization information'}
        </p>
      </div>

      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardHeader>
          <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateOrganization.bind(null, org.id) as any} className="space-y-6">
            <div>
              <Label htmlFor="displayName" className="text-proofound-charcoal dark:text-foreground">
                Organization Name
              </Label>
              <Input
                id="displayName"
                name="displayName"
                defaultValue={org.displayName}
                placeholder="Organization Name"
                disabled={!canEdit}
                className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
              />
            </div>

            <div>
              <Label htmlFor="legalName" className="text-proofound-charcoal dark:text-foreground">
                Legal Name (Optional)
              </Label>
              <Input
                id="legalName"
                name="legalName"
                defaultValue={org.legalName || ''}
                placeholder="Legal company name"
                disabled={!canEdit}
                className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
              />
            </div>

            <div>
              <Label htmlFor="mission" className="text-proofound-charcoal dark:text-foreground">
                Mission Statement
              </Label>
              <textarea
                id="mission"
                name="mission"
                defaultValue={org.mission || ''}
                placeholder="Describe your organization's mission and goals"
                className="flex min-h-[120px] w-full rounded-lg border border-proofound-stone dark:border-border bg-white dark:bg-background px-4 py-2 text-base transition-colors placeholder:text-proofound-charcoal/40 dark:placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:border-proofound-forest disabled:cursor-not-allowed disabled:opacity-50 text-proofound-charcoal dark:text-foreground"
                maxLength={2000}
                disabled={!canEdit}
              />
            </div>

            <div>
              <Label htmlFor="website" className="text-proofound-charcoal dark:text-foreground">
                Website
              </Label>
              <Input
                id="website"
                name="website"
                type="url"
                defaultValue={org.website || ''}
                placeholder="https://your-organization.com"
                disabled={!canEdit}
                className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
              />
            </div>

            {canEdit && (
              <Button
                type="submit"
                className="bg-proofound-forest hover:bg-proofound-forest/90 text-white"
              >
                Save Changes
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardHeader>
          <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
            Organization Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-proofound-charcoal dark:text-foreground">
              URL Slug
            </p>
            <p className="text-proofound-charcoal/70 dark:text-muted-foreground">{org.slug}</p>
            <p className="text-xs text-proofound-charcoal/70 dark:text-muted-foreground mt-1">
              Your organization URL: /app/o/{org.slug}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-proofound-charcoal dark:text-foreground">Type</p>
            <p className="text-proofound-charcoal/70 dark:text-muted-foreground capitalize">
              {org.type}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
