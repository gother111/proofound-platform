import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LeftNav } from '@/components/app/LeftNav';
import { TopBar } from '@/components/app/TopBar';
import { OrgContextProvider } from '@/features/org/context';

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.warn('[org/layout] 404', { reason: 'no-user', slug: params.slug });
    notFound();
  }

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, slug, display_name')
    .eq('slug', params.slug)
    .maybeSingle();

  if (orgError || !org?.id || !org.slug) {
    console.warn('[org/layout] 404', {
      reason: orgError ? 'org-load-error' : 'org-not-found',
      slug: params.slug,
      user: user.id,
      error: orgError ? String(orgError) : null,
    });
    notFound();
  }

  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('status, role')
    .eq('user_id', user.id)
    .eq('organization_id', org.id)
    .maybeSingle();

  if (membershipError || !membership || membership.status !== 'active') {
    console.warn('[org/layout] 404', {
      reason: membershipError ? 'membership-error' : 'no-active-membership',
      slug: params.slug,
      user: user.id,
      error: membershipError ? String(membershipError) : null,
    });
    notFound();
  }

  const canEdit = ['owner', 'admin'].includes((membership.role as string) ?? '');
  const orgName = org.display_name ?? 'Organization';
  const orgInitials = orgName
    .split(' ')
    .filter(Boolean)
    .map((name: string) => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <OrgContextProvider value={{ orgId: org.id, slug: org.slug, canEdit }}>
      <div className="flex h-screen" style={{ backgroundColor: '#F5F3EE' }}>
        <LeftNav />
        <div className="flex-1 flex flex-col">
          <TopBar userName={orgName} userInitials={orgInitials} />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </OrgContextProvider>
  );
}
