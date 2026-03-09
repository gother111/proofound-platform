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
  linkedin: true,
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
  return {
    header: incoming.header ?? defaultVisibility.header,
    proofBar: incoming.proofBar ?? defaultVisibility.proofBar,
    workEmail: incoming.workEmail ?? defaultVisibility.workEmail,
    linkedin: incoming.linkedin ?? defaultVisibility.linkedin,
    identity: incoming.identity ?? defaultVisibility.identity,
    counts: incoming.counts ?? defaultVisibility.counts,
    skills: incoming.skills ?? defaultVisibility.skills,
    bio: incoming.bio ?? defaultVisibility.bio,
    contact: incoming.contact ?? defaultVisibility.contact,
  };
}

export type { VisibilityFlags };
