import { requireAuth, getActiveOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { assignments, matches } from '@/db/schema';
import { eq, desc, count, and } from 'drizzle-orm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AppSurface } from '@/components/ui/v2/AppSurface';

export const dynamic = 'force-dynamic';

interface Assignment {
  id: string;
  role: string;
  description: string | null;
  status: string;
  locationMode: string | null;
  country: string | null;
  city: string | null;
  compMin: number | null;
  compMax: number | null;
  currency: string | null;
  mustHaveSkills: unknown;
  createdAt: Date;
  updatedAt: Date;
}

function getSkillDisplayLabel(skill: any) {
  return skill?.label || skill?.name || skill?.skillName || skill?.id || 'Unknown skill';
}

export default async function OpportunitiesPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireAuth();
  const { slug } = await params;
  const result = await getActiveOrg(slug, user.id);

  if (!result) {
    notFound();
  }

  const { org, membership } = result;

  // Fetch all assignments for this organization
  const orgAssignments = await db.query.assignments.findMany({
    where: eq(assignments.orgId, org.id),
    orderBy: (t) => [desc(t.createdAt)],
  });

  // Count matches per assignment
  const assignmentMatchCounts = await Promise.all(
    orgAssignments.map(async (assignment) => {
      const matchCountResult = await db
        .select({ count: count() })
        .from(matches)
        .where(eq(matches.assignmentId, assignment.id));

      return {
        assignmentId: assignment.id,
        matchCount: matchCountResult[0]?.count || 0,
      };
    })
  );

  const matchCountMap = assignmentMatchCounts.reduce(
    (acc, item) => {
      acc[item.assignmentId] = item.matchCount;
      return acc;
    },
    {} as Record<string, number>
  );

  const canManage = membership.role === 'owner' || membership.role === 'admin';

  const formatLocation = (assignment: Assignment) => {
    const parts = [];
    if (assignment.locationMode) {
      parts.push(assignment.locationMode);
    }
    if (assignment.city) {
      parts.push(assignment.city);
    }
    if (assignment.country) {
      parts.push(assignment.country);
    }
    return parts.length > 0 ? parts.join(', ') : 'Not specified';
  };

  const formatCompensation = (assignment: Assignment) => {
    if (assignment.compMin && assignment.compMax) {
      const currency = assignment.currency || 'USD';
      return `${currency} ${assignment.compMin.toLocaleString()} - ${assignment.compMax.toLocaleString()}`;
    }
    return 'Not specified';
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-700';
      case 'draft':
        return 'bg-gray-50 text-gray-700';
      case 'hold':
        return 'bg-yellow-50 text-yellow-700';
      case 'closed':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <AppSurface>
      <div className="max-w-6xl mx-auto space-y-8 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display font-semibold text-primary-500 mb-2">
              Opportunities
            </h1>
            <p className="text-neutral-dark-600">
              Manage your open positions and assignments for {org.displayName}
            </p>
          </div>
          {canManage && (
            <Link href={`/app/o/${slug}/matching`}>
              <Button size="lg">Create New Opportunity</Button>
            </Link>
          )}
        </div>

        {orgAssignments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <h3 className="text-xl font-semibold text-neutral-dark-700 mb-2">
                No opportunities yet
              </h3>
              <p className="text-neutral-dark-500 mb-6">
                Get started by creating your first opportunity to find the right talent
              </p>
              {canManage && (
                <Link href={`/app/o/${slug}/matching`}>
                  <Button>Create Your First Opportunity</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {orgAssignments.map((assignment) => {
              const mustHaveSkillsArray = (assignment.mustHaveSkills as any[]) || [];
              const matchCount = matchCountMap[assignment.id] || 0;

              return (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-2xl">{assignment.role}</CardTitle>
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusBadgeClass(
                              assignment.status
                            )}`}
                          >
                            {assignment.status}
                          </span>
                        </div>
                        <CardDescription className="text-base">
                          {assignment.description || 'No description provided'}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {canManage && (
                          <>
                            <Link href={`/app/o/${slug}/assignments/${assignment.id}`}>
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </Link>
                            <Link href={`/app/o/${slug}/matching?assignment=${assignment.id}`}>
                              <Button size="sm">View Matches ({matchCount})</Button>
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Location */}
                      <div>
                        <h4 className="text-sm font-medium text-neutral-dark-500 mb-1">Location</h4>
                        <p className="text-neutral-dark-700">{formatLocation(assignment)}</p>
                      </div>

                      {/* Compensation */}
                      <div>
                        <h4 className="text-sm font-medium text-neutral-dark-500 mb-1">
                          Compensation
                        </h4>
                        <p className="text-neutral-dark-700">{formatCompensation(assignment)}</p>
                      </div>

                      {/* Skills */}
                      <div>
                        <h4 className="text-sm font-medium text-neutral-dark-500 mb-1">
                          Required Skills ({mustHaveSkillsArray.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {mustHaveSkillsArray.slice(0, 3).map((skill: any, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center rounded-md bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700"
                            >
                              {getSkillDisplayLabel(skill)} L{skill.level}
                            </span>
                          ))}
                          {mustHaveSkillsArray.length > 3 && (
                            <span className="inline-flex items-center rounded-md bg-neutral-light-100 px-2 py-1 text-xs font-medium text-neutral-dark-700">
                              +{mustHaveSkillsArray.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-6 pt-6 border-t border-neutral-light-200 flex items-center justify-between text-sm text-neutral-dark-500">
                      <div>Created {new Date(assignment.createdAt).toLocaleDateString()}</div>
                      {matchCount > 0 && (
                        <div className="font-medium text-primary-600">
                          {matchCount} candidate{matchCount !== 1 ? 's' : ''} matched
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Status Filter (future enhancement) */}
        {orgAssignments.length > 0 && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-neutral-dark-600">Filter by status:</span>
            <div className="flex gap-2">
              {['all', 'active', 'draft', 'hold', 'closed'].map((status) => (
                <Link
                  key={status}
                  href={`/app/o/${slug}/opportunities${status !== 'all' ? `?status=${status}` : ''}`}
                  className="px-3 py-1 rounded-md hover:bg-neutral-light-100 capitalize"
                >
                  {status}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppSurface>
  );
}
