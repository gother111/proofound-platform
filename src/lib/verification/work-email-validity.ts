const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

type WorkEmailValidityInput = {
  work_email_verified?: boolean | null;
  work_email_reverify_due_at?: string | null;
  work_email_verified_at?: string | null;
  verified_at?: string | null;
};

export type WorkEmailValidity = {
  isCurrentlyVerified: boolean;
  needsReverify: boolean;
  reverifyDueAt: string | null;
};

function toTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function deriveReverifyDueAt(input: WorkEmailValidityInput): string | null {
  const explicitDueAtMs = toTimestamp(input.work_email_reverify_due_at);
  if (explicitDueAtMs !== null) {
    return new Date(explicitDueAtMs).toISOString();
  }

  const verifiedAtMs =
    toTimestamp(input.work_email_verified_at) ?? toTimestamp(input.verified_at) ?? null;
  if (verifiedAtMs === null) {
    return null;
  }

  return new Date(verifiedAtMs + ONE_YEAR_MS).toISOString();
}

export function resolveWorkEmailValidity(input: WorkEmailValidityInput): WorkEmailValidity {
  const verified = Boolean(input.work_email_verified);
  const reverifyDueAt = deriveReverifyDueAt(input);
  const dueAtMs = toTimestamp(reverifyDueAt);
  const needsReverify = Boolean(verified && dueAtMs !== null && dueAtMs <= Date.now());

  return {
    isCurrentlyVerified: verified && !needsReverify,
    needsReverify,
    reverifyDueAt,
  };
}
