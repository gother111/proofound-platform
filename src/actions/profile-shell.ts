'use server';

import { sql } from 'drizzle-orm';

import { db } from '@/db';
import { getRows } from '@/lib/db/rows';
import { requireAuth } from '@/lib/auth';
import { isAccessiblePublicPortfolioState } from '@/lib/portfolio/public-contract';
import type {
  Education,
  Experience,
  ProfileData,
  PurposeLinks,
  Volunteering,
} from '@/types/profile';

const ARCHIVED_INDIVIDUAL_PURPOSE_LINKS: PurposeLinks = Object.freeze({
  values: [],
  causes: [],
});

function countValue(row: { count?: number | string | bigint | null } | undefined): number {
  const value = row?.count;
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toJoinedDate(value: Date | string | null | undefined): string {
  const date = value ? new Date(value) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  return safeDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function parseJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapExperienceShell(row: {
  id: string;
  title: string | null;
  organizationName: string | null;
  duration: string | null;
  verified: boolean | null;
}): Experience {
  return {
    id: row.id,
    title: row.title || 'Work context',
    organizationName: row.organizationName || null,
    orgDescription: '',
    duration: row.duration || '',
    outcomes: '',
    projects: '',
    colleagues: '',
    achievements: '',
    measuredOutcomes: [],
    projectEntries: [],
    verified: row.verified,
  };
}

function mapEducationShell(row: {
  id: string;
  institution: string | null;
  degree: string | null;
  duration: string | null;
  verified: boolean | null;
}): Education {
  return {
    id: row.id,
    institution: row.institution || 'Learning context',
    degree: row.degree || 'Learning context',
    duration: row.duration || '',
    skills: '',
    projects: '',
    measuredOutcomes: [],
    verified: row.verified,
  };
}

function mapVolunteeringShell(row: {
  id: string;
  title: string | null;
  cause: string | null;
  duration: string | null;
  verified: boolean | null;
}): Volunteering {
  return {
    id: row.id,
    title: row.title || 'Volunteering context',
    orgDescription: '',
    duration: row.duration || '',
    cause: row.cause || '',
    impact: '',
    skillsDeployed: '',
    personalWhy: '',
    measuredOutcomes: [],
    verified: row.verified,
  };
}

export async function getProfileShellData(): Promise<ProfileData> {
  const user = await requireAuth();

  const result = await db.execute(sql`
    SELECT
      p.display_name,
      p.handle,
      p.avatar_url,
      p.created_at,
      p.public_portfolio_state,
      ip.headline,
      ip.location,
      ip.tagline,
      ip.redact_mode,
      ip.field_visibility,
      mp.timezone,
      mp.desired_roles,
      mp.work_mode,
      mp.engagement_type,
      ps.effective_state,
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', s.id,
              'skillId', s.skill_id,
              'nameI18n', st.name_i18n
            )
            ORDER BY s.created_at ASC
          )
          FROM skills s
          LEFT JOIN skills_taxonomy st ON st.code = s.skill_code
          WHERE s.profile_id = ${user.id}
        ),
        '[]'::jsonb
      ) AS skills_json,
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', e.id,
              'title', e.title,
              'organizationName', e.organization_name,
              'duration', e.duration,
              'verified', e.verified
            )
            ORDER BY e.created_at DESC
          )
          FROM experiences e
          WHERE e.user_id = ${user.id}
        ),
        '[]'::jsonb
      ) AS experiences_json,
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', ed.id,
              'institution', ed.institution,
              'degree', ed.degree,
              'duration', ed.duration,
              'verified', ed.verified
            )
            ORDER BY ed.created_at DESC
          )
          FROM education ed
          WHERE ed.user_id = ${user.id}
        ),
        '[]'::jsonb
      ) AS education_json,
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', v.id,
              'title', v.title,
              'cause', v.cause,
              'duration', v.duration,
              'verified', v.verified
            )
            ORDER BY v.created_at DESC
          )
          FROM volunteering v
          WHERE v.user_id = ${user.id}
        ),
        '[]'::jsonb
      ) AS volunteering_json,
      (
        SELECT COUNT(*)::int
        FROM proof_packs pp
        WHERE pp.owner_type = 'individual_profile'
          AND pp.owner_id = ${user.id}
          AND pp.deleted_at IS NULL
      ) AS proof_pack_count,
      (
        SELECT COUNT(*)::int
        FROM verification_records vr
        WHERE vr.owner_type = 'individual_profile'
          AND vr.owner_id = ${user.id}
          AND vr.status = 'verified'
          AND vr.integrity_status = 'clear'
      ) AS accepted_verification_count,
      (
        SELECT COUNT(*)::int
        FROM proof_packs pp
        WHERE pp.owner_type = 'individual_profile'
          AND pp.owner_id = ${user.id}
          AND pp.deleted_at IS NULL
          AND pp.visibility IN ('public', 'link_only')
      ) AS public_proof_count
    FROM profiles p
    LEFT JOIN individual_profiles ip ON ip.user_id = p.id
    LEFT JOIN matching_profiles mp ON mp.profile_id = p.id
    LEFT JOIN LATERAL (
      SELECT effective_state
      FROM portfolio_publication_states
      WHERE subject_id = p.id
      ORDER BY last_computed_at DESC
      LIMIT 1
    ) ps ON TRUE
    WHERE p.id = ${user.id}
    LIMIT 1
  `);

  const row = (getRows(result)[0] ?? {}) as Record<string, unknown>;
  const skillRows = parseJsonArray<{ id: string; skillId: string | null; nameI18n: unknown }>(
    row.skills_json
  );
  const experienceRows = parseJsonArray<Parameters<typeof mapExperienceShell>[0]>(
    row.experiences_json
  );
  const educationRows = parseJsonArray<Parameters<typeof mapEducationShell>[0]>(row.education_json);
  const volunteeringRows = parseJsonArray<Parameters<typeof mapVolunteeringShell>[0]>(
    row.volunteering_json
  );
  const proofPackCount = countValue({ count: row.proof_pack_count as any });
  const acceptedVerificationCount = countValue({ count: row.accepted_verification_count as any });
  const publicProofCount = countValue({ count: row.public_proof_count as any });
  const publicationEffectiveState = row.effective_state ?? row.public_portfolio_state ?? null;
  const fieldVisibility =
    row.field_visibility && typeof row.field_visibility === 'object'
      ? {
          experiences: 'private' as const,
          education: 'private' as const,
          volunteering: 'private' as const,
          ...(row.field_visibility as Record<string, 'public' | 'network' | 'private'>),
        }
      : {
          experiences: 'private' as const,
          education: 'private' as const,
          volunteering: 'private' as const,
        };

  return {
    basicInfo: {
      name: (row.display_name as string | null | undefined) ?? user.displayName ?? 'Your Name',
      tagline: (row.tagline as string | null | undefined) ?? null,
      location: (row.location as string | null | undefined) ?? null,
      joinedDate: toJoinedDate(row.created_at as Date | string | null | undefined),
      avatar: (row.avatar_url as string | null | undefined) ?? user.avatarUrl ?? null,
      coverImage: null,
    },
    mission: null,
    vision: null,
    missionLinks: ARCHIVED_INDIVIDUAL_PURPOSE_LINKS,
    visionLinks: ARCHIVED_INDIVIDUAL_PURPOSE_LINKS,
    values: [],
    causes: [],
    skills: skillRows.map((row) => {
      const nameI18n = row.nameI18n as Record<string, string> | null;
      return {
        id: row.id,
        name: nameI18n?.en || row.skillId || 'Unknown Skill',
        verified: false,
      };
    }),
    proofArtifactCount: proofPackCount,
    anchoredProofPackCount: proofPackCount,
    acceptedVerificationCount,
    publicProofCount,
    publishedPortfolio:
      typeof publicationEffectiveState === 'string' &&
      isAccessiblePublicPortfolioState(publicationEffectiveState as any),
    proofPacks: [],
    impactStories: [],
    experiences: experienceRows.map(mapExperienceShell),
    education: educationRows.map(mapEducationShell),
    volunteering: volunteeringRows.map(mapVolunteeringShell),
    fieldVisibility,
    redactMode: (row.redact_mode as boolean | null | undefined) ?? false,
    guidedSetup: {
      handle: (row.handle as string | null | undefined) ?? null,
      headline: (row.headline as string | null | undefined) ?? null,
      timezone: (row.timezone as string | null | undefined) ?? null,
      desiredRoles: Array.isArray(row.desired_roles) ? (row.desired_roles as string[]) : [],
      workMode: (row.work_mode as string | null | undefined) ?? null,
      engagementType: (row.engagement_type as string | null | undefined) ?? null,
    },
  };
}
