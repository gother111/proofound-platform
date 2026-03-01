import { z } from 'zod';

import { CvImportCandidateSchema } from '@/lib/expertise/cv-import-suggest';

export const CvImportWizardContextSchema = z.literal('cv');

export const CvImportWizardEvidenceSchema = z.array(z.string().min(1)).min(1).max(3);

export const CvImportWizardWorkExperienceSchema = z.object({
  item_id: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
  organization: z.string().min(1).max(200),
  duration: z.string().min(1).max(120),
  summary: z.string().min(1).max(2000),
  evidence_snippets: CvImportWizardEvidenceSchema,
  confidence: z.number().min(0).max(1),
});

export const CvImportWizardLearningExperienceSchema = z.object({
  item_id: z.string().min(1).max(200),
  institution: z.string().min(1).max(200),
  degree: z.string().min(1).max(200),
  duration: z.string().min(1).max(120),
  skills: z.string().min(1).max(1000),
  projects: z.string().min(1).max(1000),
  evidence_snippets: CvImportWizardEvidenceSchema,
  confidence: z.number().min(0).max(1),
});

export const CvImportWizardVolunteeringSchema = z.object({
  item_id: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
  organization: z.string().min(1).max(200),
  duration: z.string().min(1).max(120),
  cause: z.string().min(1).max(300),
  impact: z.string().min(1).max(1000),
  skills_deployed: z.string().min(1).max(1000),
  personal_why: z.string().min(1).max(1000),
  evidence_snippets: CvImportWizardEvidenceSchema,
  confidence: z.number().min(0).max(1),
});

export const CvImportWizardLanguageLevelSchema = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

export const CvImportWizardLanguageSchema = z.object({
  item_id: z.string().min(1).max(200),
  language_code: z.string().min(1).max(10),
  language_name: z.string().min(1).max(100),
  level: CvImportWizardLanguageLevelSchema,
  evidence_snippets: CvImportWizardEvidenceSchema,
  confidence: z.number().min(0).max(1),
});

export const CvImportWizardSuggestDocumentSchema = z.object({
  document_id: z.string().min(1).max(128),
  file_name: z.string().min(1).max(260),
  text: z.string().min(1),
  context: CvImportWizardContextSchema.default('cv'),
});

export const CvImportWizardSuggestRequestSchema = z.object({
  documents: z.array(CvImportWizardSuggestDocumentSchema).min(1),
  suggestions_limit: z.number().int().min(5).max(10).optional(),
});

export const CvImportWizardSuggestDocumentResultSchema = z.object({
  document_id: z.string(),
  file_name: z.string(),
  context: CvImportWizardContextSchema,
  parsed_text: z.string().default(''),
  parse_error: z.string().optional().nullable(),
  parse_error_code: z.string().optional().nullable(),
  work_experiences: z.array(CvImportWizardWorkExperienceSchema),
  learning_experiences: z.array(CvImportWizardLearningExperienceSchema),
  volunteering: z.array(CvImportWizardVolunteeringSchema),
  languages: z.array(CvImportWizardLanguageSchema),
  skill_candidates: z.array(CvImportCandidateSchema),
});

export const CvImportWizardMetadataSchema = z.object({
  semantic_used: z.boolean(),
  semantic_fallback_triggered: z.boolean(),
  fallback_stage: z
    .enum([
      'none',
      'python_multipart_failed',
      'python_json_retry',
      'typescript_retry',
      'candidate_only',
    ])
    .optional(),
  candidate_only_fallback_triggered: z.boolean().optional(),
  match_dependency_error_code: z.string().optional(),
  unmapped_candidates_count: z.number().int().min(0),
  limits: z.object({
    max_documents: z.number().int().positive(),
    max_chars_per_document: z.number().int().positive(),
    max_total_chars: z.number().int().positive(),
  }),
  ai_provider: z.literal('gemini').optional(),
  ai_model: z.string().optional().nullable(),
  ai_key_slot: z.enum(['primary', 'secondary']).optional().nullable(),
  ai_fallback_reason: z.string().optional().nullable(),
  cost_ore: z.number().int().min(0).optional(),
  currency: z.literal('SEK').optional(),
  idempotency_key: z.string().optional(),
  engine_mode: z.enum(['auto', 'typescript', 'python', 'gemini']).optional(),
  engine_used: z.enum(['python', 'typescript', 'gemini']).optional(),
});

export const CvImportWizardSuggestResponseSchema = z.object({
  documents: z.array(CvImportWizardSuggestDocumentResultSchema),
  metadata: CvImportWizardMetadataSchema,
});

export const CvImportWizardApplyDocumentSchema = z.object({
  document_id: z.string().min(1).max(128),
  file_name: z.string().min(1).max(260),
  work_experiences: z.array(CvImportWizardWorkExperienceSchema).default([]),
  learning_experiences: z.array(CvImportWizardLearningExperienceSchema).default([]),
  volunteering: z.array(CvImportWizardVolunteeringSchema).default([]),
  languages: z.array(CvImportWizardLanguageSchema).default([]),
  skill_ids: z.array(z.string().min(1)).default([]),
});

export const CvImportWizardApplyRequestSchema = z.object({
  documents: z.array(CvImportWizardApplyDocumentSchema).min(1),
});

export const CvImportWizardApplyCountsSchema = z.object({
  skills: z.number().int().min(0),
  work_experiences: z.number().int().min(0),
  learning_experiences: z.number().int().min(0),
  volunteering: z.number().int().min(0),
  languages: z.number().int().min(0),
});

export const CvImportWizardApplyResponseSchema = z.object({
  imported_counts: CvImportWizardApplyCountsSchema,
  skipped_counts: CvImportWizardApplyCountsSchema,
  warnings: z.array(z.string()),
});

export type CvImportWizardSuggestRequest = z.infer<typeof CvImportWizardSuggestRequestSchema>;
export type CvImportWizardSuggestResponse = z.infer<typeof CvImportWizardSuggestResponseSchema>;
export type CvImportWizardApplyRequest = z.infer<typeof CvImportWizardApplyRequestSchema>;
export type CvImportWizardApplyResponse = z.infer<typeof CvImportWizardApplyResponseSchema>;

export type CvImportWizardWorkExperience = z.infer<typeof CvImportWizardWorkExperienceSchema>;
export type CvImportWizardLearningExperience = z.infer<
  typeof CvImportWizardLearningExperienceSchema
>;
export type CvImportWizardVolunteering = z.infer<typeof CvImportWizardVolunteeringSchema>;
export type CvImportWizardLanguage = z.infer<typeof CvImportWizardLanguageSchema>;
