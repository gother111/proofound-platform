import { requirePersona, getActiveOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { LeftNav } from '@/components/app/LeftNav';
import { TopBar } from '@/components/app/TopBar';
import { DeferredTourProvider } from '@/components/tour/DeferredTourProvider';

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

  const isV2 = process.env.NEXT_PUBLIC_UI_REFACTOR_V2 === 'true';

  return (
    <div className={`flex h-screen ${isV2 ? 'bg-japandi-bg' : 'bg-proofound-parchment'}`}>
      <LeftNav basePath={`/app/o/${slug}`} isBetaTesting={user.isBetaTesting} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar userName={orgName} userInitials={orgInitials} basePath={`/app/o/${slug}`} />
        <main
          id="app-main-content"
          data-app-main
          className="relative mb-[4.75rem] flex-1 overflow-y-auto overflow-x-hidden pb-[calc(5.5rem+env(safe-area-inset-bottom))] scroll-pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:mb-0 md:pb-0 md:scroll-pb-0"
          role="main"
          aria-label="Main content"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scrollable landmark must be keyboard focusable for WCAG 2.1.1
          tabIndex={0}
        >
          {children}
        </main>
      </div>
      <DeferredTourProvider />
    </div>
  );
}
