import { createHash } from 'crypto';
import { db } from '@/db';
import { getRows } from '@/lib/db/rows';
import { normalizeOrganizationWebsite } from '@/lib/organizations/normalizeWebsite';
import type { SnippetFields } from '@/lib/profile/snippet-generator';
import { sql } from 'drizzle-orm';
import { CAPABILITY_TOKEN_CLASSES, redeemCapabilityToken } from '@/lib/security/capability-tokens';

export type SnippetProfileType = 'individual' | 'organization';
export type SnippetTheme = 'light' | 'dark' | 'auto';
export type SnippetFormat = 'card' | 'mini' | 'full';

function normalizeSnippetTheme(theme: SnippetTheme | null | undefined): SnippetTheme {
  void theme;
  return 'light';
}

type DbSnippetRow = {
  id: string;
  user_id: string;
  fields: unknown;
  theme: SnippetTheme;
  format: SnippetFormat;
  expires_at: string | null;
  created_at: string;
  profile_type: SnippetProfileType | null;
  org_id: string | null;
};

export type PublicSnippet = {
  id: string;
  userId: string;
  fields: SnippetFields;
  theme: SnippetTheme;
  format: SnippetFormat;
  expiresAt: string | null;
  createdAt: string;
  profileType: SnippetProfileType;
  orgId: string | null;
};

export type PublicSnippetViewModel = {
  profileType: SnippetProfileType;
  format: SnippetFormat;
  theme: SnippetTheme;
  title: string;
  subtitle: string | null;
  avatarImage: string | null;
  heroImage: string | null;
  location: string | null;
  website: string | null;
  foundedYear: number | null;
  typeLabel: string | null;
  about: string | null;
  skills: Array<{ id: string; name: string; level: number | null }>;
  experiences: Array<{ id: string; title: string; orgDescription: string; duration: string }>;
  education: Array<{ id: string; institution: string; degree: string; duration: string }>;
  values: string[];
  causes: string[];
  workCultureHighlights: string[];
  impactEntries: Array<{
    id: string;
    title: string;
    description: string;
    timeframe: string;
    metrics: Array<{ name: string; value: string; unit: string }>;
  }>;
  redacted: boolean;
  hasVisibleFields: boolean;
};

export type SnippetViewRequestMeta = {
  ip: string | null;
  userAgent: string | null;
  referrer: string | null;
};

type PublicSnippetAnalyticsSource = 'public_snippet_page' | 'public_snippet_embed';

const INDIVIDUAL_VISIBILITY_DEFAULTS: Record<string, 'public' | 'network' | 'private'> = {
  headline: 'public',
  location: 'network',
  values: 'public',
  causes: 'public',
  skills: 'public',
  experiences: 'private',
  education: 'private',
  avatar: 'public',
  displayName: 'public',
};

const ORGANIZATION_VISIBILITY_DEFAULTS: Record<string, string> = {
  display_name: 'public',
  mission: 'public',
  vision: 'public',
  causes: 'public',
  work_culture: 'post_match',
  impact: 'post_match',
};

function parseSnippetFields(raw: unknown): SnippetFields {
  if (!raw) {
    return {};
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as SnippetFields;
      }
    } catch {
      return {};
    }
    return {};
  }

  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as SnippetFields;
  }

  return {};
}

function isEnabled(fields: SnippetFields, key: string): boolean {
  return fields[key] === true;
}

function toObject(value: unknown): Record<string, unknown> {
  if (!value) {
    return {};
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return {};
    }
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function isIndividualVisibilityPublic(
  visibility: Record<string, unknown>,
  key: string | null
): boolean {
  if (!key) {
    return true;
  }

  const raw = visibility[key];
  const value =
    typeof raw === 'string' && raw.trim().length > 0
      ? raw.trim()
      : (INDIVIDUAL_VISIBILITY_DEFAULTS[key] ?? 'public');
  return value === 'public';
}

function isOrganizationVisibilityPublic(
  visibility: Record<string, unknown>,
  key: string | null
): boolean {
  if (!key) {
    return true;
  }

  const raw = visibility[key];
  const value =
    typeof raw === 'string' && raw.trim().length > 0
      ? raw.trim()
      : (ORGANIZATION_VISIBILITY_DEFAULTS[key] ?? 'public');
  return value === 'public';
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function buildIndividualAbout(
  bio: string | null,
  mission: string | null,
  vision: string | null
): string | null {
  const cleanBio = bio?.trim();
  if (cleanBio) {
    return cleanBio;
  }

  const sections: string[] = [];
  if (mission?.trim()) {
    sections.push(`Mission: ${mission.trim()}`);
  }
  if (vision?.trim()) {
    sections.push(`Vision: ${vision.trim()}`);
  }

  return sections.length > 0 ? sections.join('\n\n') : null;
}

function buildWorkCultureHighlights(workCulture: unknown): string[] {
  const culture = toObject(workCulture);
  return Object.entries(culture)
    .filter(([, value]) => typeof value === 'string' || typeof value === 'number')
    .slice(0, 6)
    .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`);
}

function buildImpactEntries(value: unknown): PublicSnippetViewModel['impactEntries'] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry: any) => ({
      id: typeof entry?.id === 'string' ? entry.id : crypto.randomUUID(),
      title: typeof entry?.title === 'string' ? entry.title : 'Impact Entry',
      description: typeof entry?.description === 'string' ? entry.description : '',
      timeframe: typeof entry?.timeframe === 'string' ? entry.timeframe : '',
      metrics: Array.isArray(entry?.metrics)
        ? entry.metrics
            .map((metric: any) => ({
              name: typeof metric?.name === 'string' ? metric.name : '',
              value: typeof metric?.value === 'string' ? metric.value : '',
              unit: typeof metric?.unit === 'string' ? metric.unit : '',
            }))
            .filter((metric: { name: string }) => metric.name.length > 0)
        : [],
    }))
    .slice(0, 3);
}

export function extractSnippetViewMeta(headers: Headers): SnippetViewRequestMeta {
  const forwardedFor = headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0]?.trim() || null : null;

  return {
    ip,
    userAgent: headers.get('user-agent'),
    referrer: headers.get('referer'),
  };
}

function hashPublicSnippetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function recordPublicSnippetAnalyticsEvent(params: {
  eventType: string;
  snippetId?: string | null;
  userId?: string | null;
  source: PublicSnippetAnalyticsSource;
  profileType?: SnippetProfileType | null;
  reasonCode?: string | null;
  requestMeta: SnippetViewRequestMeta;
  token?: string;
}) {
  try {
    await db.execute(sql`
      INSERT INTO analytics_events (
        event_type,
        user_id,
        entity_type,
        entity_id,
        properties,
        created_at
      ) VALUES (
        ${params.eventType},
        ${params.userId ?? null},
        'page',
        ${params.snippetId ?? null},
        ${JSON.stringify({
          source: params.source,
          profile_type: params.profileType ?? null,
          reason_code: params.reasonCode ?? null,
          referrer_present: Boolean(params.requestMeta.referrer),
          token_hash: params.token ? hashPublicSnippetToken(params.token) : null,
        })}::jsonb,
        NOW()
      )
    `);
  } catch {
    // Best effort analytics, do not block public rendering.
  }
}

export async function getSnippetByToken(token: string): Promise<PublicSnippet | null> {
  const safeToken = token.trim();
  if (!safeToken || safeToken.length > 200) {
    return null;
  }

  const redeemed = await redeemCapabilityToken(safeToken, {
    tokenClass: CAPABILITY_TOKEN_CLASSES.PROFILE_SNIPPET_SHARE,
    consume: false,
    metadata: { surface: 'public_snippet_read' },
  });

  if (!redeemed.ok) {
    return null;
  }

  const result = await db.execute(sql`
    SELECT
      id,
      user_id,
      fields,
      theme,
      format,
      expires_at,
      created_at,
      profile_type,
      org_id
    FROM profile_snippets
    WHERE capability_token_id = ${redeemed.token.id}::uuid
      AND deleted_at IS NULL
      AND revoked_at IS NULL
      AND public_surface_disabled_at IS NULL
      AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1
  `);

  const [row] = getRows<DbSnippetRow>(result as any);
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    fields: parseSnippetFields(row.fields),
    theme: normalizeSnippetTheme(row.theme),
    format: row.format ?? 'card',
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    profileType: row.profile_type === 'organization' ? 'organization' : 'individual',
    orgId: row.org_id,
  };
}

async function buildIndividualSnippetViewModel(
  snippet: PublicSnippet
): Promise<PublicSnippetViewModel | null> {
  const profileResult = await db.execute(sql`
    SELECT
      p.display_name,
      p.handle,
      p.avatar_url,
      ip.headline,
      ip.tagline,
      ip.bio,
      ip.location,
      ip.values,
      ip.causes,
      ip.mission,
      ip.vision,
      ip.cover_image_url,
      ip.field_visibility,
      ip.redact_mode
    FROM profiles p
    LEFT JOIN individual_profiles ip ON ip.user_id = p.id
    WHERE p.id = ${snippet.userId}
    LIMIT 1
  `);

  const [profile] = getRows<any>(profileResult as any);
  if (!profile) {
    return null;
  }

  const visibility = toObject(profile.field_visibility);
  const canInclude = (fieldKey: string, visibilityKey: string | null = null) =>
    isEnabled(snippet.fields, fieldKey) && isIndividualVisibilityPublic(visibility, visibilityKey);

  const redacted = Boolean(profile.redact_mode);
  if (redacted) {
    return {
      profileType: 'individual',
      format: snippet.format,
      theme: snippet.theme,
      title: 'Profile is temporarily hidden',
      subtitle: null,
      avatarImage: null,
      heroImage: null,
      location: null,
      website: null,
      foundedYear: null,
      typeLabel: null,
      about: null,
      skills: [],
      experiences: [],
      education: [],
      values: [],
      causes: [],
      workCultureHighlights: [],
      impactEntries: [],
      redacted: true,
      hasVisibleFields: false,
    };
  }

  const displayNameRaw =
    typeof profile.display_name === 'string' && profile.display_name.trim().length > 0
      ? profile.display_name.trim()
      : typeof profile.handle === 'string'
        ? profile.handle.trim()
        : 'Proofound Member';
  const title = canInclude('name', 'displayName') ? displayNameRaw : 'Proofound Member';
  const subtitle =
    canInclude('headline', 'headline') && (profile.headline?.trim() || profile.tagline?.trim())
      ? profile.headline?.trim() || profile.tagline?.trim()
      : null;
  const about =
    canInclude('bio') || canInclude('bio', 'mission') || canInclude('bio', 'vision')
      ? buildIndividualAbout(profile.bio, profile.mission, profile.vision)
      : null;
  const location = canInclude('location', 'location') ? (profile.location ?? null) : null;
  const avatarImage = canInclude('profileImage', 'avatar') ? (profile.avatar_url ?? null) : null;
  const heroImage = canInclude('profileImage') ? (profile.cover_image_url ?? null) : null;
  const values = canInclude('values', 'values')
    ? Array.isArray(profile.values)
      ? profile.values
          .map((entry: any) =>
            typeof entry?.label === 'string' ? entry.label.trim() : String(entry ?? '').trim()
          )
          .filter((label: string) => label.length > 0)
      : []
    : [];
  const causes = canInclude('causes', 'causes') ? asStringArray(profile.causes) : [];

  let skills: PublicSnippetViewModel['skills'] = [];
  if (canInclude('skills', 'skills')) {
    const topSkillsRaw =
      typeof snippet.fields.topSkills === 'number' && snippet.fields.topSkills > 0
        ? Math.min(20, Math.floor(snippet.fields.topSkills))
        : 5;
    const skillsResult = await db.execute(sql`
      SELECT
        s.id,
        COALESCE(st.name_i18n ->> 'en', st.name_i18n ->> 'default', s.skill_code, s.skill_id) AS name,
        s.level
      FROM skills s
      LEFT JOIN skills_taxonomy st ON st.code = s.skill_code
      WHERE s.profile_id = ${snippet.userId}
      ORDER BY s.level DESC NULLS LAST, s.created_at DESC
      LIMIT ${topSkillsRaw}
    `);

    skills = getRows<any>(skillsResult as any).map((row: any) => ({
      id: row.id,
      name: typeof row.name === 'string' ? row.name : 'Skill',
      level: typeof row.level === 'number' ? row.level : null,
    }));
  }

  let experiences: PublicSnippetViewModel['experiences'] = [];
  if (canInclude('experience', 'experiences')) {
    const experienceResult = await db.execute(sql`
      SELECT id, title, org_description, duration
      FROM experiences
      WHERE user_id = ${snippet.userId}
      ORDER BY created_at DESC
      LIMIT 5
    `);

    experiences = getRows<any>(experienceResult as any).map((row: any) => ({
      id: row.id,
      title: row.title ?? '',
      orgDescription: row.org_description ?? '',
      duration: row.duration ?? '',
    }));
  }

  let education: PublicSnippetViewModel['education'] = [];
  if (canInclude('education', 'education')) {
    const educationResult = await db.execute(sql`
      SELECT id, institution, degree, duration
      FROM education
      WHERE user_id = ${snippet.userId}
      ORDER BY created_at DESC
      LIMIT 5
    `);

    education = getRows<any>(educationResult as any).map((row: any) => ({
      id: row.id,
      institution: row.institution ?? '',
      degree: row.degree ?? '',
      duration: row.duration ?? '',
    }));
  }

  const hasVisibleFields =
    Boolean(subtitle || about || location || avatarImage || heroImage) ||
    values.length > 0 ||
    causes.length > 0 ||
    skills.length > 0 ||
    experiences.length > 0 ||
    education.length > 0;

  return {
    profileType: 'individual',
    format: snippet.format,
    theme: snippet.theme,
    title,
    subtitle,
    avatarImage,
    heroImage,
    location,
    website: null,
    foundedYear: null,
    typeLabel: null,
    about,
    skills,
    experiences,
    education,
    values,
    causes,
    workCultureHighlights: [],
    impactEntries: [],
    redacted: false,
    hasVisibleFields,
  };
}

async function buildOrganizationSnippetViewModel(
  snippet: PublicSnippet
): Promise<PublicSnippetViewModel | null> {
  if (!snippet.orgId) {
    return null;
  }

  const orgResult = await db.execute(sql`
    SELECT
      id,
      display_name,
      tagline,
      mission,
      vision,
      website,
      founded_date,
      type,
      locations,
      causes,
      logo_url,
      cover_image_url,
      work_culture,
      impact_entries
    FROM organizations
    WHERE id = ${snippet.orgId}
    LIMIT 1
  `);

  const [org] = getRows<any>(orgResult as any);
  if (!org) {
    return null;
  }

  const visibilityResult = await db.execute(sql`
    SELECT
      display_name,
      mission,
      vision,
      causes,
      work_culture,
      impact
    FROM organization_field_visibility
    WHERE org_id = ${snippet.orgId}
    LIMIT 1
  `);
  const [visibilityRow] = getRows<any>(visibilityResult as any);
  const visibility = toObject(visibilityRow);

  const canInclude = (fieldKey: string, visibilityKey: string | null = null) =>
    isEnabled(snippet.fields, fieldKey) &&
    isOrganizationVisibilityPublic(visibility, visibilityKey);

  const title =
    canInclude('displayName', 'display_name') && typeof org.display_name === 'string'
      ? org.display_name
      : 'Proofound Organization';
  const subtitle =
    canInclude('tagline') && typeof org.tagline === 'string' && org.tagline.trim().length > 0
      ? org.tagline.trim()
      : null;
  const aboutParts: string[] = [];
  if (canInclude('mission', 'mission') && typeof org.mission === 'string' && org.mission.trim()) {
    aboutParts.push(`Mission: ${org.mission.trim()}`);
  }
  if (canInclude('vision', 'vision') && typeof org.vision === 'string' && org.vision.trim()) {
    aboutParts.push(`Vision: ${org.vision.trim()}`);
  }
  const about = aboutParts.length > 0 ? aboutParts.join('\n\n') : null;

  const website =
    canInclude('website') && typeof org.website === 'string'
      ? normalizeOrganizationWebsite(org.website).value
      : null;
  const avatarImage = canInclude('logo') ? (org.logo_url ?? null) : null;
  const heroImage = canInclude('coverImage') ? (org.cover_image_url ?? null) : null;
  const location =
    canInclude('locations') && Array.isArray(org.locations) && org.locations.length > 0
      ? String(org.locations[0])
      : null;
  const causes = canInclude('causes', 'causes') ? asStringArray(org.causes) : [];
  const workCultureHighlights = canInclude('workCulture', 'work_culture')
    ? buildWorkCultureHighlights(org.work_culture)
    : [];
  const impactEntries = canInclude('impact', 'impact')
    ? buildImpactEntries(org.impact_entries)
    : [];
  const foundedYear =
    canInclude('foundedDate') && org.founded_date ? new Date(org.founded_date).getFullYear() : null;
  const typeLabel = canInclude('type') && typeof org.type === 'string' ? org.type : null;

  const hasVisibleFields =
    Boolean(
      subtitle ||
        about ||
        website ||
        location ||
        avatarImage ||
        heroImage ||
        foundedYear ||
        typeLabel
    ) ||
    causes.length > 0 ||
    workCultureHighlights.length > 0 ||
    impactEntries.length > 0;

  return {
    profileType: 'organization',
    format: snippet.format,
    theme: snippet.theme,
    title,
    subtitle,
    avatarImage,
    heroImage,
    location,
    website,
    foundedYear,
    typeLabel,
    about,
    skills: [],
    experiences: [],
    education: [],
    values: [],
    causes,
    workCultureHighlights,
    impactEntries,
    redacted: false,
    hasVisibleFields,
  };
}

export async function buildPublicSnippetViewModel(
  snippet: PublicSnippet
): Promise<PublicSnippetViewModel | null> {
  if (snippet.profileType === 'organization') {
    return buildOrganizationSnippetViewModel(snippet);
  }
  return buildIndividualSnippetViewModel(snippet);
}

export async function recordSnippetView(
  snippet: Pick<PublicSnippet, 'id' | 'userId' | 'profileType'>,
  requestMeta: SnippetViewRequestMeta,
  source: PublicSnippetAnalyticsSource
): Promise<void> {
  try {
    await db.execute(sql`
      INSERT INTO profile_snippet_views (
        snippet_id,
        viewer_ip,
        viewer_user_agent,
        referrer,
        viewed_at
      ) VALUES (
        ${snippet.id},
        ${requestMeta.ip},
        ${requestMeta.userAgent},
        ${requestMeta.referrer},
        NOW()
      )
    `);
  } catch {
    // Best effort analytics, do not block public rendering.
  }

  await recordPublicSnippetAnalyticsEvent({
    eventType: 'public_snippet_viewed',
    snippetId: snippet.id,
    userId: snippet.userId,
    source,
    profileType: snippet.profileType,
    requestMeta,
  });
}

export async function recordUnavailableSnippetView(params: {
  token: string;
  requestMeta: SnippetViewRequestMeta;
  source: PublicSnippetAnalyticsSource;
  reasonCode?: string;
}) {
  await recordPublicSnippetAnalyticsEvent({
    eventType: 'public_snippet_unavailable',
    source: params.source,
    reasonCode: params.reasonCode ?? 'token_invalid_or_unavailable',
    requestMeta: params.requestMeta,
    token: params.token,
  });
}
