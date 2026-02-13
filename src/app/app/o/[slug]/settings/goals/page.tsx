import { GoalsManager } from '@/components/organization/GoalsManager';
import { getActiveOrg, requireAuth } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function OrganizationGoalsSettingsPage({
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
  const canManageSettings = membership.role === 'owner' || membership.role === 'admin';
  if (!canManageSettings) {
    redirect(`/app/o/${slug}/home`);
  }

  return (
    <div className="max-w-5xl mx-auto min-h-screen bg-proofound-parchment dark:bg-background p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-['Crimson_Pro'] font-semibold text-proofound-forest dark:text-primary mb-2">
          Goal Settings
        </h1>
        <p className="text-proofound-charcoal/70 dark:text-muted-foreground">
          Manage organizational goals and track progress.
        </p>
      </div>

      <GoalsManager orgId={org.id} canEdit={canManageSettings} />
    </div>
  );
}
