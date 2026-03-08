import type { SupabaseClient } from '@supabase/supabase-js';

export async function reserveProfileHandle(
  supabase: SupabaseClient,
  profileId: string,
  slug: string
): Promise<void> {
  const existing = await supabase
    .from('profile_handle_history')
    .select('profile_id')
    .eq('slug', slug)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  if (existing.data && existing.data.profile_id !== profileId) {
    throw new Error('Handle already reserved.');
  }

  const historyInsert = existing.data
    ? await supabase
        .from('profile_handle_history')
        .update({
          is_active: true,
          redirect_target_slug: slug,
          retired_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('slug', slug)
    : await supabase.from('profile_handle_history').insert({
        profile_id: profileId,
        slug,
        is_active: true,
        redirect_target_slug: slug,
        retired_at: null,
        updated_at: new Date().toISOString(),
      });

  if (historyInsert.error) {
    throw historyInsert.error;
  }
}

export async function reserveOrganizationSlug(
  supabase: SupabaseClient,
  orgId: string,
  slug: string
): Promise<void> {
  const existing = await supabase
    .from('organization_slug_history')
    .select('org_id')
    .eq('slug', slug)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  if (existing.data && existing.data.org_id !== orgId) {
    throw new Error('Organization slug already reserved.');
  }

  const historyInsert = existing.data
    ? await supabase
        .from('organization_slug_history')
        .update({
          is_active: true,
          redirect_target_slug: slug,
          retired_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('slug', slug)
    : await supabase.from('organization_slug_history').insert({
        org_id: orgId,
        slug,
        is_active: true,
        redirect_target_slug: slug,
        retired_at: null,
        updated_at: new Date().toISOString(),
      });

  if (historyInsert.error) {
    throw historyInsert.error;
  }
}
