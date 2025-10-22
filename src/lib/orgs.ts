import type { SupabaseClient } from '@supabase/supabase-js';

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function ensureOrgSlug(
  supabase: SupabaseClient,
  orgId: string,
  displayName: string | null
): Promise<string> {
  const { data: org, error: readErr } = await supabase
    .from('organizations')
    .select('id, slug, display_name')
    .eq('id', orgId)
    .single();

  if (readErr) {
    throw new Error('read-org-failed');
  }

  if (org.slug) {
    return org.slug;
  }

  const base = toSlug(displayName ?? orgId);
  let candidate = base || toSlug(orgId);
  let suffix = 1;

  for (let i = 0; i < 10; i++) {
    const { data: conflict } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();

    if (!conflict) {
      const { error: updateErr, data: updated } = await supabase
        .from('organizations')
        .update({ slug: candidate })
        .eq('id', orgId)
        .select('slug')
        .single();

      if (!updateErr && updated?.slug) {
        return updated.slug;
      }

      if (updateErr) {
        if (!/duplicate|unique/i.test(updateErr.message)) {
          throw updateErr;
        }
      }
    }

    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  throw new Error('slug-ensure-failed');
}
