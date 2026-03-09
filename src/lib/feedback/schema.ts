import { z } from 'zod';

import { StructuredFeedbackSchema } from '@/lib/contracts/launch-operations';

export const AnswerSchema = z.object({
  questionId: z.string().uuid(),
  score: z.number().min(0).max(10).optional(),
  textAnswer: z.string().max(2000).optional(),
});

export const SubmitPayloadSchema = z
  .object({
    interviewId: z.string().uuid().optional(),
    direction: z.enum(['candidate_to_org', 'org_to_candidate']),
    templateId: z.string().uuid().optional(),
    answers: z.array(AnswerSchema).min(1).optional(),
    overallScore: z.number().min(0).max(10).optional(),
    token: z.string().optional(),
    structuredFeedback: StructuredFeedbackSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if ((!value.answers || value.answers.length === 0) && !value.structuredFeedback) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['answers'],
        message: 'Provide answers, structured feedback, or both.',
      });
    }
  });
