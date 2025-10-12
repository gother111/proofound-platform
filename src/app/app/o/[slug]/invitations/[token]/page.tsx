import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { orgInvitations, organizations, organizationMembers } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { acceptInvitation } from '@/actions/org';
import { Building2, Mail } from 'lucide-react';

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const user = await requireAuth();
  const { slug, token } = await params;

  // Find invitation
  const [invitation] = await db
    .select({
      invitation: orgInvitations,
      org: organizations,
    })
    .from(orgInvitations)
    .innerJoin(organizations, eq(orgInvitations.orgId, organizations.id))
    .where(
      and(
        eq(orgInvitations.token, token),
        eq(organizations.slug, slug),
        gt(orgInvitations.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!invitation) {
    notFound();
  }

  // Check if user already is a member
  const [existingMembership] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(eq(organizationMembers.orgId, invitation.org.id), eq(organizationMembers.userId, user.id))
    )
    .limit(1);

  if (existingMembership) {
    // Already a member, redirect to org
    redirect(`/app/o/${slug}/home`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-100 px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-primary-500" />
          </div>
          <CardTitle>You&apos;re invited!</CardTitle>
          <CardDescription>You&apos;ve been invited to join an organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4 p-4 bg-primary-50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-neutral-dark-700">{invitation.org.displayName}</p>
              {invitation.org.mission && (
                <p className="text-sm text-neutral-dark-600 mt-1 line-clamp-2">
                  {invitation.org.mission}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-dark-600">Your role:</span>
              <span className="font-medium text-neutral-dark-700 capitalize">
                {invitation.invitation.role}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-dark-600">Invited to:</span>
              <span className="font-medium text-neutral-dark-700">
                {invitation.invitation.email}
              </span>
            </div>
          </div>

          <form
            action={async () => {
              'use server';
              const result = await acceptInvitation(token);
              if (result.success && result.orgSlug) {
                redirect(`/app/o/${result.orgSlug}/home`);
              }
            }}
            className="space-y-4"
          >
            <Button type="submit" className="w-full" size="lg">
              Accept Invitation
            </Button>
            <p className="text-xs text-center text-neutral-dark-500">
              By accepting, you&apos;ll become a member of this organization
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
