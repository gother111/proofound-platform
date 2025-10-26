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
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-display font-semibold text-primary-500 mb-2">
          Organization Settings
        </h1>
        <p className="text-neutral-dark-600">
          Manage settings and view activity for {org.displayName}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Information</CardTitle>
          <CardDescription>Basic details about your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-neutral-dark-700">Organization ID</p>
            <p className="text-neutral-dark-600 font-mono text-sm">{org.id}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-dark-700">Created</p>
            <p className="text-neutral-dark-600">{formatDate(org.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-dark-700">Your Role</p>
            <p className="text-neutral-dark-600 capitalize">{membership.role}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
          <CardDescription>Recent activity and changes</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-neutral-dark-500">No audit logs yet</p>
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
                    className="flex items-start justify-between py-3 border-b border-neutral-light-200 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-neutral-dark-700">{log.action}</p>
                      {log.targetType && (
                        <p className="text-xs text-neutral-dark-500">
                          {log.targetType}: {log.targetId}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-neutral-dark-500">{formatDate(log.createdAt)}</p>
                  </div>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {membership.role === 'owner' && (
        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-dark-600 mb-4">
              Organization deletion and transfer features coming soon
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
