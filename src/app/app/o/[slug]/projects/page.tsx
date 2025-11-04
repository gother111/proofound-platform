/**
 * Projects Page - Organization
 * 
 * Manage organization-wide projects
 */

import { requireAuth, getActiveOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { ProjectsList } from '@/components/organization/ProjectsList';

export const dynamic = 'force-dynamic';

export default async function OrgProjectsPage({
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

  // Check if user can edit
  const canEdit = membership.role === 'owner' || membership.role === 'admin';

  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-proofound-parchment dark:bg-background p-6">
      <ProjectsList orgId={org.id} canEdit={canEdit} />
    </div>
  );
}
