import { z } from 'zod';

export const GeminiSkillCategorySchema = z.enum([
  'technical',
  'soft_skills',
  'tools_technologies',
  'languages',
  'certifications',
  'other',
]);

export const GeminiSkillCandidateSchema = z.object({
  document_id: z.string().min(1).max(128),
  raw_skill_text: z.string().min(1).max(120),
  category: z.string().default('other'),
  confidence: z.coerce.number().default(0.5),
  evidence_snippet: z.union([z.string(), z.array(z.string())]).default(''),
  taxonomy_candidate_skill_ids: z.array(z.string().min(1).max(64)).max(3).default([]),
});

export const GeminiDocumentsExtractionSchema = z.object({
  skills: z.array(GeminiSkillCandidateSchema).default([]),
});

export type GeminiSkillCandidate = z.infer<typeof GeminiSkillCandidateSchema>;
export type GeminiDocumentsExtraction = z.infer<typeof GeminiDocumentsExtractionSchema>;

export const GEMINI_DOCUMENTS_EXTRACTION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    skills: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          document_id: { type: 'string' },
          raw_skill_text: { type: 'string' },
          category: {
            type: 'string',
            enum: [
              'technical',
              'soft_skills',
              'tools_technologies',
              'languages',
              'certifications',
              'other',
            ],
          },
          confidence: { type: 'number' },
          evidence_snippet: { type: 'string' },
          taxonomy_candidate_skill_ids: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
        required: ['document_id', 'raw_skill_text'],
      },
    },
  },
  required: ['skills'],
} as const;
