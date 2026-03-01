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
