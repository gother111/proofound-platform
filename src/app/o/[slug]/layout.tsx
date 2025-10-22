import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { OrgContextProvider } from '@/features/org/context';
import { OrgSubnav } from '@/features/org/OrgSubnav';
import { getOrgBySlug, getViewerOrgMembership, viewerCanEditOrg } from '@/features/org/data';
import { createServerClient } from '@/lib/supabase/server';

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const { slug } = params;
  const supabase = await createServerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const org = await getOrgBySlug(slug);

  if (!org) {
    console.warn('[org/layout] notFound', {
      reason: 'org-not-found',
      slug,
      userId: user?.id ?? null,
    });
    notFound();
  }

  if (!user) {
    console.warn('[org/layout] notFound', {
      reason: 'no-user',
      slug,
    });
    notFound();
  }

  const membership = await getViewerOrgMembership(org.id, user.id);

  if (!membership || membership.status !== 'active') {
    console.warn('[org/layout] notFound', {
      reason: 'no-active-membership',
      slug,
      userId: user.id,
      membership,
    });
    notFound();
  }

  const canEdit = viewerCanEditOrg(membership.role);

  return (
    <OrgContextProvider
      value={{
        orgId: org.id,
        slug: org.slug ?? slug,
        displayName: org.display_name ?? 'Organization',
        canEdit,
      }}
    >
      <div className="min-h-screen bg-muted/20">
        <header className="border-b bg-background">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Organization
              </p>
              <h1 className="text-2xl font-semibold text-foreground">
                {org.display_name ?? 'Organization'}
              </h1>
            </div>
            <OrgSubnav slug={org.slug} />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
      </div>
    </OrgContextProvider>
  );
}
