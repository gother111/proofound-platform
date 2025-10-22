import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getOrgBySlug, getOrgDashboardStats } from '@/features/org/data';

export default async function OrganizationHome({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const org = await getOrgBySlug(slug);

  if (!org) {
    notFound();
  }

  const stats = await getOrgDashboardStats(org.id);
  const basePath = `/app/o/${slug}`;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Card className="min-h-[220px]">
          <CardHeader>
            <CardTitle>Goals</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center">
            <p className="mb-4 text-muted-foreground">Set one meaningful goal for the week.</p>
            <Button asChild>
              <Link href={`${basePath}/goals/new`}>Create Goal</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="min-h-[220px]">
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center">
            <p className="mb-4 text-muted-foreground">Build trust through verification.</p>
            <Button asChild>
              <Link href={`${basePath}/settings/verifications`}>Start</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="min-h-[220px]">
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center">
            <p className="mb-2 text-muted-foreground">
              {stats.projectsCount > 0
                ? `${stats.projectsCount} active ${stats.projectsCount === 1 ? 'project' : 'projects'}.`
                : 'No active projects yet.'}
            </p>
            <Button asChild>
              <Link href={`${basePath}/projects`}>Explore</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="min-h-[220px] md:col-span-2">
          <CardHeader>
            <CardTitle>Matches</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center">
            <p className="mb-4 text-muted-foreground">
              Turn on matching to discover aligned people and projects.
            </p>
            <Button asChild>
              <Link href={`${basePath}/settings/matching`}>Open preferences</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="min-h-[220px]">
          <CardHeader>
            <CardTitle>Team</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center">
            <p className="mb-2 text-muted-foreground">
              {stats.membersCount > 0
                ? `${stats.membersCount} active ${stats.membersCount === 1 ? 'member' : 'members'}.`
                : 'Build your team.'}
            </p>
            <Button asChild>
              <Link href={`${basePath}/team/invite`}>Add members</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="min-h-[220px] md:col-span-2 xl:col-span-3">
          <CardHeader>
            <CardTitle>Explore</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center">
            <p className="mb-4 text-muted-foreground">
              Discover opportunities aligned with your interests.
            </p>
            <Button asChild>
              <Link href="/explore">Start exploring</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
