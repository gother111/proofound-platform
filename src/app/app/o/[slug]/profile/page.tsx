import { requireAuth, getActiveOrg, assertOrgRole } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updateOrganization } from '@/actions/org';

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

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-display font-semibold text-primary-500 mb-2">
          Organization Profile
        </h1>
        <p className="text-neutral-dark-600">
          {canEdit ? 'Update your organization information' : 'View organization information'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateOrganization.bind(null, org.id) as any} className="space-y-6">
            <div>
              <Label htmlFor="displayName">Organization Name</Label>
              <Input
                id="displayName"
                name="displayName"
                defaultValue={org.displayName}
                placeholder="Organization Name"
                disabled={!canEdit}
              />
            </div>

            <div>
              <Label htmlFor="legalName">Legal Name (Optional)</Label>
              <Input
                id="legalName"
                name="legalName"
                defaultValue={org.legalName || ''}
                placeholder="Legal company name"
                disabled={!canEdit}
              />
            </div>

            <div>
              <Label htmlFor="mission">Mission Statement</Label>
              <textarea
                id="mission"
                name="mission"
                defaultValue={org.mission || ''}
                placeholder="Describe your organization's mission and goals"
                className="flex min-h-[120px] w-full rounded-lg border border-neutral-light-300 bg-white px-4 py-2 text-base transition-colors placeholder:text-neutral-dark-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
                maxLength={2000}
                disabled={!canEdit}
              />
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                type="url"
                defaultValue={org.website || ''}
                placeholder="https://your-organization.com"
                disabled={!canEdit}
              />
            </div>

            {canEdit && <Button type="submit">Save Changes</Button>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-neutral-dark-700">URL Slug</p>
            <p className="text-neutral-dark-600">{org.slug}</p>
            <p className="text-xs text-neutral-dark-500 mt-1">
              Your organization URL: /app/o/{org.slug}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-dark-700">Type</p>
            <p className="text-neutral-dark-600 capitalize">{org.type}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
