import { requireAuth, getActiveOrg } from '@/lib/auth';
import { db } from '@/db';
import { organizationMembers, profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { inviteMember, removeMember } from '@/actions/org';

export const runtime = 'nodejs';

export default async function OrganizationMembersPage({
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

  // Get all members
  const members = await db
    .select({
      membership: organizationMembers,
      profile: profiles,
    })
    .from(organizationMembers)
    .innerJoin(profiles, eq(organizationMembers.userId, profiles.id))
    .where(eq(organizationMembers.orgId, org.id));

  const canManage = membership.role === 'owner' || membership.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-semibold text-primary-500 mb-2">
            Team Members
          </h1>
          <p className="text-neutral-dark-600">Manage who has access to {org.displayName}</p>
        </div>
      </div>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Invite New Member</CardTitle>
            <CardDescription>Send an invitation to join your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={inviteMember.bind(null, org.id) as any} className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="email" className="sr-only">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="colleague@example.com"
                  required
                />
              </div>
              <div className="w-40">
                <select
                  name="role"
                  className="flex h-11 w-full rounded-lg border border-neutral-light-300 bg-white px-4 py-2 text-base"
                  required
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <Button type="submit">Send Invite</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map(({ membership: m, profile: p }) => (
              <div
                key={m.userId}
                className="flex items-center justify-between py-4 border-b border-neutral-light-200 last:border-0"
              >
                <div>
                  <p className="font-medium text-neutral-dark-700">
                    {p.displayName || p.handle || 'Unnamed User'}
                  </p>
                  <p className="text-sm text-neutral-dark-500">{p.handle && `@${p.handle}`}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700 capitalize">
                    {m.role}
                  </span>
                  {canManage && m.userId !== user.id && m.role !== 'owner' && (
                    <form action={removeMember.bind(null, org.id, m.userId) as any}>
                      <Button variant="ghost" size="sm" type="submit">
                        Remove
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
