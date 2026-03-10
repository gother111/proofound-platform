import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { organizations, profiles } from '@/db/schema';

function encodeSegment(value: string) {
  return encodeURIComponent(value);
}

export function revalidatePublicPortfolioHandle(handle: string) {
  const encoded = encodeSegment(handle);
  revalidatePath(`/portfolio/${encoded}`);
  revalidatePath(`/api/portfolio/public/${encoded}/summary`);
  revalidatePath(`/api/portfolio/public/${encoded}/export`);
  revalidatePath('/sitemap.xml');
}

export function revalidatePublicOrganizationPortfolioSlug(slug: string) {
  const encoded = encodeSegment(slug);
  revalidatePath(`/portfolio/org/${encoded}`);
  revalidatePath(`/api/portfolio/org/${encoded}/export`);
  revalidatePath('/sitemap.xml');
}

export async function revalidatePublicPortfolioByProfileId(profileId: string) {
  const [profile] = await db
    .select({ handle: profiles.handle })
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1);

  if (profile?.handle) {
    revalidatePublicPortfolioHandle(profile.handle);
  } else {
    revalidatePath('/sitemap.xml');
  }
}

export async function revalidatePublicOrganizationPortfolioById(orgId: string) {
  const [organization] = await db
    .select({ slug: organizations.slug })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (organization?.slug) {
    revalidatePublicOrganizationPortfolioSlug(organization.slug);
  } else {
    revalidatePath('/sitemap.xml');
  }
}
