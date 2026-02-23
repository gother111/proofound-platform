import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { getRows } from '@/lib/db/rows';
import { normalizeOrganizationWebsite } from '@/lib/organizations/normalizeWebsite';

type OrganizationVisibilityLevel =
  | 'public'
  | 'post_match'
  | 'post_conversation_start'
  | 'internal_only';

type OrganizationVisibilityRow = {
  display_name?: OrganizationVisibilityLevel | null;
  mission?: OrganizationVisibilityLevel | null;
  vision?: OrganizationVisibilityLevel | null;
  causes?: OrganizationVisibilityLevel | null;
};

type OrganizationRow = {
  id: string;
  slug: string;
  display_name: string | null;
  tagline: string | null;
  mission: string | null;
  vision: string | null;
  website: string | null;
  causes: string[] | null;
  type: string | null;
  founded_date: string | null;
  logo_url: string | null;
};

export type PublicOrganizationPortfolio = {
  slug: string;
  displayName: string;
  tagline: string | null;
  mission: string | null;
  vision: string | null;
  causes: string[];
  website: string | null;
  typeLabel: string | null;
  foundedYear: number | null;
  logoUrl: string | null;
  hasVisibleContent: boolean;
};

export const ORGANIZATION_DAY_ONE_VISIBILITY = {
  display_name: 'public',
  mission: 'public',
  vision: 'public',
  causes: 'public',
  work_culture: 'internal_only',
  structure: 'internal_only',
  projects: 'internal_only',
  partnerships: 'internal_only',
  goals: 'internal_only',
  impact: 'internal_only',
} as const;

function isPublic(level: unknown): boolean {
  return typeof level === 'string' && level === 'public';
}

function normalizeCauses(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0
  );
}

function normalizeFoundedYear(value: string | null): number | null {
  if (!value) return null;
  const year = new Date(value).getFullYear();
  return Number.isNaN(year) ? null : year;
}

export function defaultOrganizationDayOneVisibility() {
  return { ...ORGANIZATION_DAY_ONE_VISIBILITY };
}

export async function getPublicOrganizationPortfolioBySlug(
  slug: string
): Promise<PublicOrganizationPortfolio | null> {
  const orgResult = await db.execute(sql`
    SELECT
      id,
      slug,
      display_name,
      tagline,
      mission,
      vision,
      website,
      causes,
      type,
      founded_date,
      logo_url
    FROM organizations
    WHERE slug = ${slug}
    LIMIT 1
  `);

  const [org] = getRows<OrganizationRow>(orgResult as any);
  if (!org) return null;

  const visibilityResult = await db.execute(sql`
    SELECT
      display_name,
      mission,
      vision,
      causes
    FROM organization_field_visibility
    WHERE org_id = ${org.id}
    LIMIT 1
  `);

  const [visibility] = getRows<OrganizationVisibilityRow>(visibilityResult as any);
  const defaults = defaultOrganizationDayOneVisibility();

  const allowDisplayName = visibility
    ? isPublic(visibility.display_name)
    : isPublic(defaults.display_name);
  const allowMission = visibility ? isPublic(visibility.mission) : isPublic(defaults.mission);
  const allowVision = visibility ? isPublic(visibility.vision) : isPublic(defaults.vision);
  const allowCauses = visibility ? isPublic(visibility.causes) : isPublic(defaults.causes);

  const displayName =
    allowDisplayName && typeof org.display_name === 'string' && org.display_name.trim().length > 0
      ? org.display_name.trim()
      : 'Organization';

  const tagline =
    allowDisplayName && typeof org.tagline === 'string' && org.tagline.trim().length > 0
      ? org.tagline.trim()
      : null;

  const mission =
    allowMission && typeof org.mission === 'string' && org.mission.trim()
      ? org.mission.trim()
      : null;
  const vision =
    allowVision && typeof org.vision === 'string' && org.vision.trim() ? org.vision.trim() : null;
  const causes = allowCauses ? normalizeCauses(org.causes) : [];
  const website = allowDisplayName ? normalizeOrganizationWebsite(org.website).value : null;
  const foundedYear = allowDisplayName ? normalizeFoundedYear(org.founded_date) : null;
  const typeLabel =
    allowDisplayName && typeof org.type === 'string' && org.type.trim() ? org.type.trim() : null;
  const logoUrl = allowDisplayName && typeof org.logo_url === 'string' ? org.logo_url : null;

  return {
    slug: org.slug,
    displayName,
    tagline,
    mission,
    vision,
    causes,
    website,
    typeLabel,
    foundedYear,
    logoUrl,
    hasVisibleContent: Boolean(
      tagline || mission || vision || website || typeLabel || foundedYear || causes.length
    ),
  };
}
