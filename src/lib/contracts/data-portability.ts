import { z } from 'zod';

const ProfileImportSchema = z.object({
  headline: z.string().optional(),
  bio: z.string().optional(),
  mission: z.string().optional(),
  vision: z.string().optional(),
  tagline: z.string().optional(),
  location: z.string().optional(),
  values: z.any().optional(),
  causes: z.array(z.string()).optional(),
});

const SkillImportSchema = z.object({
  skillCode: z.string().min(1),
  level: z.number().min(0).max(5),
  lastUsed: z.string().nullable().optional(),
  notes: z.string().optional(),
});

const ExperienceImportSchema = z.object({
  type: z.string().optional().default('work'),
  organization: z.string().min(1),
  role: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().nullable().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
});

const VolunteeringImportSchema = z.object({
  organization: z.string().min(1),
  role: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().nullable().optional(),
  description: z.string().optional(),
  hoursPerWeek: z.number().optional(),
});

export const UserDataImportV3Schema = z.object({
  version: z
    .string()
    .min(1)
    .refine((value) => value.split('.')[0] === '3', {
      message: 'Incompatible schema version',
    }),
  exportedAt: z.string().min(1),
  profile: ProfileImportSchema.optional().default({}),
  skills: z.array(SkillImportSchema).optional().default([]),
  experiences: z.array(ExperienceImportSchema).optional().default([]),
  volunteering: z.array(VolunteeringImportSchema).optional().default([]),
});

export type UserDataImportV3 = z.infer<typeof UserDataImportV3Schema>;

export const UserDataImportModeSchema = z.enum(['replace', 'merge']);
export type UserDataImportMode = z.infer<typeof UserDataImportModeSchema>;

const ImportEnvelopeSchema = z.object({
  data: z.unknown().optional(),
  mode: UserDataImportModeSchema.optional(),
  consentAcknowledged: z.boolean().optional(),
});

function normalizeLegacyExportToV3(raw: any): UserDataImportV3 {
  const individual = raw?.profile?.individual ?? {};

  const skills = (raw?.skills?.skills ?? [])
    .map((skill: any) => ({
      skillCode: skill?.skillCode || skill?.skillId || skill?.id || '',
      level: typeof skill?.level === 'number' ? skill.level : 0,
      lastUsed: skill?.lastUsedAt || skill?.lastUsed || null,
      notes: skill?.notes || undefined,
    }))
    .filter((skill: any) => skill.skillCode);

  const experiences = (raw?.workHistory?.experiences ?? []).map((experience: any) => ({
    type: experience?.type || 'work',
    organization: experience?.organization || experience?.orgDescription || 'Unknown organization',
    role: experience?.role || experience?.title || undefined,
    startDate: experience?.startDate || undefined,
    endDate: experience?.endDate || null,
    description: experience?.description || experience?.learning || undefined,
    location: experience?.location || undefined,
  }));

  const volunteering = (raw?.workHistory?.volunteering ?? []).map((entry: any) => ({
    organization: entry?.organization || entry?.orgDescription || 'Unknown organization',
    role: entry?.role || entry?.title || undefined,
    startDate: entry?.startDate || undefined,
    endDate: entry?.endDate || null,
    description: entry?.description || entry?.impact || undefined,
    hoursPerWeek: typeof entry?.hoursPerWeek === 'number' ? entry.hoursPerWeek : undefined,
  }));

  return {
    version: '3.0.0',
    exportedAt: raw?.exportDate || raw?.exportedAt || new Date().toISOString(),
    profile: {
      headline: individual?.headline,
      bio: individual?.bio,
      mission: individual?.mission,
      vision: individual?.vision,
      tagline: individual?.tagline,
      location: individual?.location,
      values: individual?.values,
      causes: individual?.causes,
    },
    skills,
    experiences,
    volunteering,
  };
}

function coerceToV3Payload(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const record = raw as Record<string, any>;

  if (record.portability && typeof record.portability === 'object') {
    return record.portability;
  }

  const hasLegacyShape =
    !!record.exportVersion ||
    !!record.exportDate ||
    !!record.profile?.basic ||
    !!record.workHistory ||
    !!record.skills?.skills;

  if (hasLegacyShape) {
    return normalizeLegacyExportToV3(record);
  }

  return raw;
}

export interface NormalizedImportRequest {
  data: UserDataImportV3;
  mode: UserDataImportMode;
  consentAcknowledged: boolean;
}

export function normalizeImportRequest(
  raw: unknown,
  options?: {
    requireConsent?: boolean;
  }
): NormalizedImportRequest {
  const envelope = ImportEnvelopeSchema.safeParse(raw);
  const mode = envelope.success ? envelope.data.mode || 'replace' : 'replace';

  const payloadSource =
    envelope.success && envelope.data.data !== undefined ? envelope.data.data : raw;

  const consentFromEnvelope = envelope.success && envelope.data.consentAcknowledged === true;
  const consentFromPayload =
    !!payloadSource &&
    typeof payloadSource === 'object' &&
    (payloadSource as Record<string, any>).consentAcknowledged === true;
  const consentAcknowledged = consentFromEnvelope || consentFromPayload;

  if (options?.requireConsent && !consentAcknowledged) {
    throw new Error('CONSENT_REQUIRED');
  }

  const payload = coerceToV3Payload(payloadSource);
  const data = UserDataImportV3Schema.parse(payload);

  return {
    data,
    mode,
    consentAcknowledged,
  };
}
