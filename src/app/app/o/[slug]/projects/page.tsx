import { redirect } from 'next/navigation';
import { getOrgSurfaceFallbackHref } from '@/lib/org/mvp-surface-policy';

export const dynamic = 'force-dynamic';

export default async function OrgProjectsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(getOrgSurfaceFallbackHref(slug, 'projects'));
}
