import { VideoIntegrationsManager } from '@/components/settings/VideoIntegrationsManager';
import { getActiveOrg, requireAuth } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { AppSurface } from '@/components/ui/v2/AppSurface';

export const dynamic = 'force-dynamic';

export default async function OrganizationIntegrationsSettingsPage({
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

  const { membership } = result;
  const canManageSettings = membership.role === 'owner' || membership.role === 'admin';
  if (!canManageSettings) {
    redirect(`/app/o/${slug}/home`);
  }

  return (
    <AppSurface>
      <div className="max-w-4xl mx-auto space-y-6 w-full">
        <div>
          <h1 className="text-3xl font-['Crimson_Pro'] font-semibold text-proofound-forest dark:text-primary mb-2">
            Integrations Settings
          </h1>
          <p className="text-proofound-charcoal/70 dark:text-muted-foreground">
            Connect Google Meet so interview scheduling can create meeting links automatically. Zoom
            is currently marked as coming soon.
          </p>
        </div>

        <VideoIntegrationsManager
          variant="standalone"
          returnTo={`/app/o/${slug}/settings/integrations`}
        />
      </div>
    </AppSurface>
  );
}
