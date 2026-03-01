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
  raw_skill_text: z.string().min(1).max(120),
  category: GeminiSkillCategorySchema.default('other'),
  confidence: z.number().min(0).max(1).default(0.5),
  evidence_snippets: z.array(z.string().min(1).max(280)).min(1).max(3),
  taxonomy_candidates: z
    .array(
      z.object({
        skill_id: z.string().min(1).max(64),
        skill_name: z.string().min(1).max(200),
        confidence: z.number().min(0).max(1),
      })
    )
    .max(3)
    .default([]),
  evidence_offsets: z
    .array(
      z.object({
        start: z.number().int().min(0),
        end: z.number().int().min(0),
      })
    )
    .max(3)
    .optional(),
});

export const GeminiDocumentSkillsSchema = z.object({
  document_id: z.string().min(1).max(128),
  skills: z.array(GeminiSkillCandidateSchema).max(80).default([]),
});

export const GeminiDocumentsExtractionSchema = z.object({
  documents: z.array(GeminiDocumentSkillsSchema).max(10),
});

export type GeminiSkillCandidate = z.infer<typeof GeminiSkillCandidateSchema>;
export type GeminiDocumentSkills = z.infer<typeof GeminiDocumentSkillsSchema>;
export type GeminiDocumentsExtraction = z.infer<typeof GeminiDocumentsExtractionSchema>;

export const GEMINI_DOCUMENTS_EXTRACTION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    documents: {
      type: 'array',
      maxItems: 10,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          document_id: { type: 'string' },
          skills: {
            type: 'array',
            maxItems: 80,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
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
                evidence_snippets: {
                  type: 'array',
                  minItems: 1,
                  maxItems: 3,
                  items: { type: 'string' },
                },
                taxonomy_candidates: {
                  type: 'array',
                  maxItems: 3,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      skill_id: { type: 'string' },
                      skill_name: { type: 'string' },
                      confidence: { type: 'number' },
                    },
                    required: ['skill_id', 'skill_name', 'confidence'],
                  },
                },
                evidence_offsets: {
                  type: 'array',
                  maxItems: 3,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      start: { type: 'integer', minimum: 0 },
                      end: { type: 'integer', minimum: 0 },
                    },
                    required: ['start', 'end'],
                  },
                },
              },
              required: ['raw_skill_text', 'category', 'confidence', 'evidence_snippets'],
            },
          },
        },
        required: ['document_id', 'skills'],
      },
    },
  },
  required: ['documents'],
  additionalProperties: false,
} as const;
