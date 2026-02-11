import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { getRows } from '@/lib/db/rows';
import type { ProfileSnippet } from '@/lib/profile/snippet-generator';
import { log } from '@/lib/log';

type SnippetFields = ProfileSnippet['fields'];

type BaseSnippetRow = {
  id: string;
  user_id: string;
  share_token: string;
  fields: unknown;
  theme: string;
  format: string;
  expires_at: string | null;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  values: unknown;
  causes: string[] | null;
};

type SkillRow = {
  id: string;
  level: number | null;
  name: string | null;
};

type ExperienceRow = {
  id: string;
  title: string;
  org_description: string;
  duration: string;
  learning: string;
  growth: string;
};

type EducationRow = {
  id: string;
  institution: string;
  degree: string;
  duration: string;
  skills: string;
  projects: string;
};

type PublicValue = {
  icon?: string;
  label: string;
};

export type PublicSnippetPayload = {
  snippetId: string;
  shareToken: string;
  theme: 'light' | 'dark' | 'auto';
  format: 'mini' | 'card' | 'full';
  expiresAt: string | null;
  profile: {
    name?: string;
    profileImage?: string;
    headline?: string;
    bio?: string;
    location?: string;
    values?: PublicValue[];
    causes?: string[];
    skills?: Array<{ id: string; name: string; level: number | null }>;
    experience?: Array<{
      id: string;
      title: string;
      orgDescription: string;
      duration: string;
      learning: string;
      growth: string;
    }>;
    education?: Array<{
      id: string;
      institution: string;
      degree: string;
      duration: string;
      skills: string;
      projects: string;
    }>;
  };
};

export type ResolvePublicSnippetResult =
  | {
      status: 'ok';
      snippet: PublicSnippetPayload;
    }
  | {
      status: 'not_found' | 'expired';
    };

type PublicViewMetadata = {
  viewerIp?: string | null;
  viewerUserAgent?: string | null;
  referrer?: string | null;
};

const TOKEN_REGEX = /^[A-Za-z0-9_-]{8,128}$/;

function sanitizeFields(raw: unknown): SnippetFields {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  const toBool = (key: keyof SnippetFields) => source[key] === true;
  const topSkillsValue = source.topSkills;
  const topSkillsNumber =
    typeof topSkillsValue === 'number' && Number.isFinite(topSkillsValue)
      ? Math.floor(topSkillsValue)
      : 5;

  return {
    name: toBool('name'),
    headline: toBool('headline'),
    bio: toBool('bio'),
    skills: toBool('skills'),
    topSkills: Math.min(20, Math.max(1, topSkillsNumber)),
    experience: toBool('experience'),
    education: toBool('education'),
    location: toBool('location'),
    profileImage: toBool('profileImage'),
    values: toBool('values'),
    causes: toBool('causes'),
  };
}

function normalizeValues(values: unknown): PublicValue[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => {
      if (!value || typeof value !== 'object') {
        return null;
      }

      const record = value as Record<string, unknown>;
      const label = typeof record.label === 'string' ? record.label.trim() : '';
      if (!label) {
        return null;
      }

      const icon =
        typeof record.icon === 'string' && record.icon.trim() ? record.icon.trim() : null;

      return {
        label,
        ...(icon ? { icon } : {}),
      };
    })
    .filter((value): value is PublicValue => value !== null);
}

function normalizeTheme(theme: string): 'light' | 'dark' | 'auto' {
  if (theme === 'light' || theme === 'dark') {
    return theme;
  }

  return 'auto';
}

function normalizeFormat(format: string): 'mini' | 'card' | 'full' {
  if (format === 'mini' || format === 'full') {
    return format;
  }

  return 'card';
}

async function getSnippetByToken(shareToken: string): Promise<BaseSnippetRow | null> {
  const result = await db.execute(sql`
    SELECT
      ps.id,
      ps.user_id,
      ps.share_token,
      ps.fields,
      ps.theme,
      ps.format,
      ps.expires_at,
      p.handle,
      p.display_name,
      p.avatar_url,
      ip.headline,
      ip.bio,
      ip.location,
      ip.values,
      ip.causes
    FROM profile_snippets ps
    JOIN profiles p ON p.id = ps.user_id
    LEFT JOIN individual_profiles ip ON ip.user_id = ps.user_id
    WHERE ps.share_token = ${shareToken}
    LIMIT 1
  `);

  const [row] = getRows<BaseSnippetRow>(result as any);
  return row ?? null;
}

async function getSnippetSkills(userId: string, limit: number) {
  const result = await db.execute(sql`
    SELECT
      s.id,
      s.level,
      COALESCE(
        st.name_i18n->>'en',
        st.name_i18n->>'default',
        st.slug,
        s.skill_code,
        s.skill_id
      ) AS name
    FROM skills s
    LEFT JOIN skills_taxonomy st ON st.code = s.skill_code
    WHERE s.profile_id = ${userId}
    ORDER BY s.level DESC NULLS LAST, s.updated_at DESC NULLS LAST, s.created_at DESC
    LIMIT ${limit}
  `);

  return getRows<SkillRow>(result as any).map((row) => ({
    id: row.id,
    level: row.level,
    name: row.name?.trim() || 'Skill',
  }));
}

async function getSnippetExperience(userId: string) {
  const result = await db.execute(sql`
    SELECT id, title, org_description, duration, learning, growth
    FROM experiences
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 5
  `);

  return getRows<ExperienceRow>(result as any).map((row) => ({
    id: row.id,
    title: row.title,
    orgDescription: row.org_description,
    duration: row.duration,
    learning: row.learning,
    growth: row.growth,
  }));
}

async function getSnippetEducation(userId: string) {
  const result = await db.execute(sql`
    SELECT id, institution, degree, duration, skills, projects
    FROM education
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 5
  `);

  return getRows<EducationRow>(result as any).map((row) => ({
    id: row.id,
    institution: row.institution,
    degree: row.degree,
    duration: row.duration,
    skills: row.skills,
    projects: row.projects,
  }));
}

export async function resolvePublicSnippet(
  shareToken: string
): Promise<ResolvePublicSnippetResult> {
  const normalizedToken = shareToken.trim();
  if (!TOKEN_REGEX.test(normalizedToken)) {
    return { status: 'not_found' };
  }

  const baseSnippet = await getSnippetByToken(normalizedToken);
  if (!baseSnippet) {
    return { status: 'not_found' };
  }

  if (baseSnippet.expires_at && new Date(baseSnippet.expires_at).getTime() <= Date.now()) {
    return { status: 'expired' };
  }

  const fields = sanitizeFields(baseSnippet.fields);

  const profile: PublicSnippetPayload['profile'] = {};

  if (fields.name) {
    profile.name = baseSnippet.display_name?.trim() || 'Proofound member';
  }

  if (fields.profileImage && baseSnippet.avatar_url) {
    profile.profileImage = baseSnippet.avatar_url;
  }

  if (fields.headline && baseSnippet.headline) {
    profile.headline = baseSnippet.headline;
  }

  if (fields.bio && baseSnippet.bio) {
    profile.bio = baseSnippet.bio;
  }

  if (fields.location && baseSnippet.location) {
    profile.location = baseSnippet.location;
  }

  if (fields.values) {
    const normalizedValues = normalizeValues(baseSnippet.values);
    if (normalizedValues.length > 0) {
      profile.values = normalizedValues;
    }
  }

  if (fields.causes && Array.isArray(baseSnippet.causes)) {
    const causes = baseSnippet.causes.filter((cause): cause is string => typeof cause === 'string');
    if (causes.length > 0) {
      profile.causes = causes;
    }
  }

  if (fields.skills) {
    profile.skills = await getSnippetSkills(baseSnippet.user_id, fields.topSkills || 5);
  }

  if (fields.experience) {
    profile.experience = await getSnippetExperience(baseSnippet.user_id);
  }

  if (fields.education) {
    profile.education = await getSnippetEducation(baseSnippet.user_id);
  }

  return {
    status: 'ok',
    snippet: {
      snippetId: baseSnippet.id,
      shareToken: baseSnippet.share_token,
      theme: normalizeTheme(baseSnippet.theme),
      format: normalizeFormat(baseSnippet.format),
      expiresAt: baseSnippet.expires_at,
      profile,
    },
  };
}

export async function recordProfileSnippetView(
  snippetId: string,
  metadata: PublicViewMetadata
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
        ${snippetId},
        ${metadata.viewerIp || null},
        ${metadata.viewerUserAgent || null},
        ${metadata.referrer || null},
        NOW()
      )
    `);
  } catch (error) {
    log.warn('profile.snippet.view.record_failed', {
      snippetId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
