import { z } from 'zod';

import {
  assertExplicitPrincipalContext,
  PRINCIPAL_TYPE_VALUES,
  type PrincipalContext,
} from './policy';

export const PrincipalContextSchema = z
  .object({
    principalType: z.enum(PRINCIPAL_TYPE_VALUES),
    orgId: z.string().uuid().nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.principalType === 'organization' && !value.orgId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'organization principal requires orgId',
        path: ['orgId'],
      });
    }
  });

export function parsePrincipalContext(
  value: unknown,
  options: { allowTrustAdmin?: boolean } = {}
): { ok: true; context: PrincipalContext } | { ok: false; error: string } {
  const parsed = PrincipalContextSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors[0]?.message ?? 'Invalid principalContext',
    };
  }

  const explicit = assertExplicitPrincipalContext(parsed.data, options);
  if (!explicit.ok) {
    return {
      ok: false,
      error: explicit.reason,
    };
  }

  return {
    ok: true,
    context: parsed.data,
  };
}

export function ensureOrganizationPrincipal(value: unknown):
  | { ok: true; context: PrincipalContext & { principalType: 'organization'; orgId: string } }
  | {
      ok: false;
      error: string;
    } {
  const parsed = parsePrincipalContext(value);
  if (!parsed.ok) {
    return parsed;
  }

  if (parsed.context.principalType !== 'organization' || !parsed.context.orgId) {
    return {
      ok: false,
      error: 'organization principal is required',
    };
  }

  return {
    ok: true,
    context: parsed.context as PrincipalContext & {
      principalType: 'organization';
      orgId: string;
    },
  };
}
