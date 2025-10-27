import { requireAuth } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function IndividualSettingsPage() {
  const user = await requireAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-8 min-h-screen bg-proofound-parchment dark:bg-background p-6">
      <div>
        <h1 className="text-4xl font-['Crimson_Pro'] font-semibold text-proofound-forest dark:text-primary mb-2">
          Settings
        </h1>
        <p className="text-proofound-charcoal/70 dark:text-muted-foreground">
          Manage your account preferences and security
        </p>
      </div>

      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardHeader>
          <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
            Account
          </CardTitle>
          <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
            Manage your email and password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-proofound-charcoal dark:text-foreground">
                Email
              </p>
              <p className="text-proofound-charcoal/70 dark:text-muted-foreground">{user.id}</p>
              <p className="text-xs text-proofound-charcoal/70 dark:text-muted-foreground mt-1">
                Contact support to change your email address
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardHeader>
          <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
            Notifications
          </CardTitle>
          <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
            Configure how you receive updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-proofound-charcoal/70 dark:text-muted-foreground">
            Notification preferences coming soon
          </p>
        </CardContent>
      </Card>

      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardHeader>
          <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
            Security
          </CardTitle>
          <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
            Two-factor authentication and security settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-proofound-charcoal/70 dark:text-muted-foreground">
            Two-factor authentication coming soon
          </p>
        </CardContent>
      </Card>

      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardHeader>
          <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
            Language
          </CardTitle>
          <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
            Choose your preferred language
          </CardDescription>
        </CardHeader>
        <CardContent>
          <select
            defaultValue="en"
            className="flex h-11 w-full max-w-xs rounded-lg border border-proofound-stone dark:border-border bg-white dark:bg-background px-4 py-2 text-base text-proofound-charcoal dark:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest"
          >
            <option value="en">English</option>
            <option value="sv">Svenska (Swedish)</option>
          </select>
        </CardContent>
      </Card>
    </div>
  );
}
