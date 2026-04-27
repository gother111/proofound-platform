import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { organizations, profiles } from '@/db/schema';

function encodeSegment(value: string) {
  return encodeURIComponent(value);
}

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('static generation store missing')) {
      throw error;
    }
  }
}

export function revalidatePublicPortfolioHandle(handle: string) {
  const encoded = encodeSegment(handle);
  safeRevalidatePath(`/portfolio/${encoded}`);
  safeRevalidatePath(`/api/portfolio/public/${encoded}/summary`);
  safeRevalidatePath(`/api/portfolio/public/${encoded}/export`);
  safeRevalidatePath('/sitemap.xml');
}

export function revalidatePublicOrganizationPortfolioSlug(slug: string) {
  const encoded = encodeSegment(slug);
  safeRevalidatePath(`/portfolio/org/${encoded}`);
  safeRevalidatePath(`/api/portfolio/org/${encoded}/export`);
  safeRevalidatePath('/sitemap.xml');
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
    safeRevalidatePath('/sitemap.xml');
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
    safeRevalidatePath('/sitemap.xml');
  }
}
