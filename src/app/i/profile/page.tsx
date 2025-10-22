import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { requireAuth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import { EditableProfileView } from '@/components/profile/EditableProfileView';

export default async function IndividualProfilePage() {
  const user = await requireAuth();
  const supabase = await createServerClient({ cookies });

  const { data: membership, error } = await supabase
    .from('organization_members')
    .select('status, organization:organizations(slug)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[i/profile] failed to load org membership', { userId: user.id, error });
  }

  type MembershipRow = {
    status: 'active' | 'inactive' | 'invited' | 'pending' | null;
    organization: { slug: string | null } | null;
  };

  const membershipRow = membership as MembershipRow | null;

  if (membershipRow?.status === 'active' && membershipRow.organization?.slug) {
    const slug = membershipRow.organization.slug;
    console.info('[i/profile] redirecting org member to org profile', { userId: user.id, slug });
    redirect(`/o/${slug}/profile`);
  }

  return <EditableProfileView />;
}
