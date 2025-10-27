import { requireAuth, getActiveOrg, assertOrgRole } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function OrganizationSettingsPage({
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

  // Only owners and admins can access settings
  if (membership.role !== 'owner' && membership.role !== 'admin') {
    redirect(`/app/o/${slug}/home`);
  }

  const supabase = await createClient();
  const { data: logsData } = await supabase
    .from('audit_logs')
    .select(`id, action, targetType:target_type, targetId:target_id, createdAt:created_at`)
    .eq('org_id', org.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const logs = logsData ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 min-h-screen bg-proofound-parchment dark:bg-background p-6">
      <div>
        <h1 className="text-4xl font-['Crimson_Pro'] font-semibold text-proofound-forest dark:text-primary mb-2">
          Organization Settings
        </h1>
        <p className="text-proofound-charcoal/70 dark:text-muted-foreground">
          Manage settings and view activity for {org.displayName}
        </p>
      </div>

      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardHeader>
          <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
            Organization Information
          </CardTitle>
          <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
            Basic details about your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-proofound-charcoal dark:text-foreground">
              Organization ID
            </p>
            <p className="text-proofound-charcoal/70 dark:text-muted-foreground font-mono text-sm">
              {org.id}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-proofound-charcoal dark:text-foreground">
              Created
            </p>
            <p className="text-proofound-charcoal/70 dark:text-muted-foreground">
              {formatDate(org.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-proofound-charcoal dark:text-foreground">
              Your Role
            </p>
            <p className="text-proofound-charcoal/70 dark:text-muted-foreground capitalize">
              {membership.role}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardHeader>
          <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
            Audit Log
          </CardTitle>
          <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
            Recent activity and changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-proofound-charcoal/70 dark:text-muted-foreground">
              No audit logs yet
            </p>
          ) : (
            <div className="space-y-2">
              {logs.map(
                (log: {
                  id: string;
                  action: string;
                  targetType?: string | null;
                  targetId?: string | null;
                  createdAt: string;
                }) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between py-3 border-b border-proofound-stone dark:border-border last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-proofound-charcoal dark:text-foreground">
                        {log.action}
                      </p>
                      {log.targetType && (
                        <p className="text-xs text-proofound-charcoal/70 dark:text-muted-foreground">
                          {log.targetType}: {log.targetId}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-proofound-charcoal/70 dark:text-muted-foreground">
                      {formatDate(log.createdAt)}
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {membership.role === 'owner' && (
        <Card className="border-proofound-stone dark:border-border rounded-2xl">
          <CardHeader>
            <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
              Danger Zone
            </CardTitle>
            <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
              Irreversible actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground mb-4">
              Organization deletion and transfer features coming soon
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
