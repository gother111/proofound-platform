import { z } from 'zod';

export const AnswerSchema = z.object({
  questionId: z.string().uuid(),
  score: z.number().min(0).max(10).optional(),
  textAnswer: z.string().max(2000).optional(),
});

export const SubmitPayloadSchema = z.object({
  interviewId: z.string().uuid().optional(),
  direction: z.enum(['candidate_to_org', 'org_to_candidate']),
  templateId: z.string().uuid().optional(),
  answers: z.array(AnswerSchema).min(1),
  overallScore: z.number().min(0).max(10).optional(),
  token: z.string().optional(),
});
