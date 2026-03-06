import { z } from 'zod';

import {
  CvImportContextSchema,
  CvImportSuggestRequestSchema,
  CvImportSuggestResponseSchema,
} from '@/lib/expertise/cv-import-suggest';
import {
  CvImportWizardSuggestRequestSchema,
  CvImportWizardSuggestResponseSchema,
} from '@/lib/expertise/cv-import-wizard-types';

export const PYTHON_INTERNAL_SERVICE_NAME = 'document_intelligence' as const;
export const PYTHON_INTERNAL_CONTRACT_VERSION = '2026-03-06.python-internal.v1' as const;

const PythonServiceMetadataFields = {
  service: z.literal(PYTHON_INTERNAL_SERVICE_NAME),
  contract_version: z.literal(PYTHON_INTERNAL_CONTRACT_VERSION),
};

const PythonServiceMetadataSchema = CvImportSuggestResponseSchema.shape.metadata.extend(
  PythonServiceMetadataFields
);

export const PythonCvImportSuggestResponseSchema = CvImportSuggestResponseSchema.extend({
  metadata: PythonServiceMetadataSchema,
});

export const PythonCvImportWizardSuggestResponseSchema = CvImportWizardSuggestResponseSchema.extend(
  {
    metadata: PythonServiceMetadataSchema,
  }
);

export const PythonCvImportExtractResponseSchema = z.object({
  documents: z.array(
    z.object({
      document_id: z.string().min(1).max(128),
      file_name: z.string().min(1).max(260),
      context: CvImportContextSchema,
      parsed_text: z.string().default(''),
      parse_error: z.string().nullable().optional(),
      parse_error_code: z.string().nullable().optional(),
    })
  ),
  metadata: PythonServiceMetadataSchema,
});

export const PythonInternalJobTypeSchema = z.enum([
  'document_intelligence_skill_report',
  'document_intelligence_wizard_report',
  'document_intelligence_quality_report',
]);

export type PythonInternalJobType = z.infer<typeof PythonInternalJobTypeSchema>;

const PythonInternalJobSourceSchema = z.string().trim().min(1).max(64).default('manual');

const PythonInternalJobBaseSchema = z.object({
  max_attempts: z.number().int().min(1).max(10).optional(),
  source: PythonInternalJobSourceSchema.optional(),
});

export const EnqueuePythonInternalJobsRequestSchema = z.object({
  jobs: z
    .array(
      z.discriminatedUnion('job_type', [
        PythonInternalJobBaseSchema.extend({
          job_type: z.literal('document_intelligence_skill_report'),
          payload: CvImportSuggestRequestSchema,
        }),
        PythonInternalJobBaseSchema.extend({
          job_type: z.literal('document_intelligence_wizard_report'),
          payload: CvImportWizardSuggestRequestSchema,
        }),
        PythonInternalJobBaseSchema.extend({
          job_type: z.literal('document_intelligence_quality_report'),
          payload: CvImportSuggestRequestSchema,
        }),
      ])
    )
    .min(1)
    .max(25),
});

export const PythonInternalWorkerRequestSchema = z.object({
  job_id: z.string().uuid(),
  job_type: PythonInternalJobTypeSchema,
  payload: z.record(z.unknown()),
});

export const PythonInternalWorkerResponseSchema = z.object({
  ok: z.literal(true),
  service: z.literal(PYTHON_INTERNAL_SERVICE_NAME),
  contract_version: z.literal(PYTHON_INTERNAL_CONTRACT_VERSION),
  job_id: z.string().uuid(),
  job_type: PythonInternalJobTypeSchema,
  result: z.record(z.unknown()),
});

export type EnqueuePythonInternalJobsRequest = z.infer<
  typeof EnqueuePythonInternalJobsRequestSchema
>;
export type PythonInternalWorkerRequest = z.infer<typeof PythonInternalWorkerRequestSchema>;
export type PythonInternalWorkerResponse = z.infer<typeof PythonInternalWorkerResponseSchema>;
