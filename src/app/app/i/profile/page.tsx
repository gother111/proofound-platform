import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { EditableProfileView } from '@/components/profile/EditableProfileView';
import { createClient } from '@/lib/supabase/server';

export default async function IndividualProfilePage() {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from('organization_members')
    .select('status, organization:organizations(slug)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })
    .limit(1)
    .maybeSingle<{
      status: string | null;
      organization: { slug: string | null } | null;
    }>();

  if (membership?.status === 'active' && membership.organization?.slug) {
    redirect(`/app/o/${membership.organization.slug}/profile`);
  }
  return <EditableProfileView />;
}
