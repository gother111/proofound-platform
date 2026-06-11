type VisibilityFlags = {
  header?: boolean;
  proofBar?: boolean;
  workEmail?: boolean;
  linkedin?: boolean;
  identity?: boolean;
  counts?: boolean;
  skills?: boolean;
  bio?: boolean;
  contact?: boolean;
};

const defaultVisibility: Required<VisibilityFlags> = {
  header: true,
  proofBar: true,
  workEmail: false,
  linkedin: false,
  identity: true,
  counts: false,
  skills: false,
  bio: false,
  contact: false,
};

export function mergeVisibilityFlags(
  stored: Record<string, unknown> | null | undefined
): Required<VisibilityFlags> {
  const incoming = (stored || {}) as VisibilityFlags;
  const normalizeFlag = (value: unknown, fallback: boolean) => {
    if (value === true) return true;
    if (value === false) return false;
    if (typeof value === 'string') return false;
    return fallback;
  };

  return {
    header: true,
    proofBar: normalizeFlag(incoming.proofBar, defaultVisibility.proofBar),
    workEmail: normalizeFlag(incoming.workEmail, defaultVisibility.workEmail),
    linkedin: false,
    identity: normalizeFlag(incoming.identity, defaultVisibility.identity),
    counts: normalizeFlag(incoming.counts, defaultVisibility.counts),
    skills: normalizeFlag(incoming.skills, defaultVisibility.skills),
    bio: normalizeFlag(incoming.bio, defaultVisibility.bio),
    contact: normalizeFlag(incoming.contact, defaultVisibility.contact),
  };
}

export type { VisibilityFlags };
