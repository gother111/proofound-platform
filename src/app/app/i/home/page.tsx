import { requireAuth } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function IndividualHomePage() {
  const user = await requireAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-display font-semibold text-primary-500 mb-2">
          Welcome back, {user.displayName || user.handle}
        </h1>
        <p className="text-neutral-dark-600">Here&apos;s what&apos;s happening with your profile</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Manage your personal information and settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/app/i/profile">View Profile</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connections</CardTitle>
            <CardDescription>Build your professional network</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-dark-500 mb-4">Coming soon</p>
            <Button variant="outline" className="w-full" disabled>
              View Connections
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verifications</CardTitle>
            <CardDescription>Showcase your verified achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-dark-500 mb-4">Coming soon</p>
            <Button variant="outline" className="w-full" disabled>
              Add Verification
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest updates and interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-dark-500">
            No recent activity yet. Start by completing your profile!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
