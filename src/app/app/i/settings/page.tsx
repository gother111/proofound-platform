import { requireAuth } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function IndividualSettingsPage() {
  const user = await requireAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-display font-semibold text-primary-500 mb-2">Settings</h1>
        <p className="text-neutral-dark-600">Manage your account preferences and security</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your email and password</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-neutral-dark-700">Email</p>
              <p className="text-neutral-dark-600">{user.id}</p>
              <p className="text-xs text-neutral-dark-500 mt-1">
                Contact support to change your email address
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configure how you receive updates</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-dark-500">Notification preferences coming soon</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Two-factor authentication and security settings</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-dark-500">Two-factor authentication coming soon</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Language</CardTitle>
          <CardDescription>Choose your preferred language</CardDescription>
        </CardHeader>
        <CardContent>
          <select
            defaultValue="en"
            className="flex h-11 w-full max-w-xs rounded-lg border border-neutral-light-300 bg-white px-4 py-2 text-base"
          >
            <option value="en">English</option>
            <option value="sv">Svenska (Swedish)</option>
          </select>
        </CardContent>
      </Card>
    </div>
  );
}
