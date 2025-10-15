import { requireAuth, getActiveOrg } from '@/lib/auth';
import { db } from '@/db';
import { organizationMembers } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const runtime = 'nodejs';

export default async function OrganizationHomePage({
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

  // Get member count
  const [memberCount] = await db
    .select({ count: count() })
    .from(organizationMembers)
    .where(eq(organizationMembers.orgId, org.id));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-display font-semibold text-primary-500 mb-2">
          {org.displayName}
        </h1>
        <p className="text-neutral-dark-600">
          {org.mission || 'Welcome to your organization dashboard'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>Team members and collaborators</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-semibold text-primary-500 mb-4">
              {memberCount.count}
            </p>
            <Button asChild className="w-full">
              <Link href={`/app/o/${slug}/members`}>Manage Members</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization Profile</CardTitle>
            <CardDescription>Public-facing information</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href={`/app/o/${slug}/profile`}>Edit Profile</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <CardDescription>Recent updates and changes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-dark-500">No recent activity</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          {(membership.role === 'owner' || membership.role === 'admin') && (
            <Button asChild>
              <Link href={`/app/o/${slug}/members`}>Invite Team Members</Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href={`/app/o/${slug}/profile`}>Update Organization Info</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
