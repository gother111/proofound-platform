import { requirePersona, getActiveOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { LeftNav } from '@/components/app/LeftNav';
import { TopBar } from '@/components/app/TopBar';
import { TourProvider } from '@/components/tour/TourProvider';

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const user = await requirePersona('org_member');
  const { slug } = await params;
  const result = await getActiveOrg(slug, user.id);

  if (!result) {
    notFound();
  }

  const { org, membership } = result;

  const orgName = org.displayName || 'Organization';
  const orgInitials = orgName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-screen bg-proofound-parchment">
      <LeftNav basePath={`/app/o/${slug}`} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar userName={orgName} userInitials={orgInitials} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0">{children}</main>
      </div>
      <TourProvider />
    </div>
  );
}
