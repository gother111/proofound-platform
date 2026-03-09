export const ORG_ROLE_VALUES = ['owner', 'admin', 'member', 'viewer'] as const;
export type OrgRole = (typeof ORG_ROLE_VALUES)[number];

export const PLATFORM_ROLE_VALUES = ['platform_admin', 'super_admin'] as const;
export type PlatformRole = (typeof PLATFORM_ROLE_VALUES)[number];

export const AUTHZ_RESOURCE_VALUES = [
  'org_profile',
  'org_trust_fields',
  'assignments',
  'candidate_shortlist_cards',
  'candidate_full_review',
  'reveal_actions',
  'interviews',
  'intros_decisions_feedback',
  'team_invites_memberships',
  'settings_privacy_defaults',
  'exports',
  'verification_summaries',
  'org_audit_logs',
  'admin_audit_logs',
] as const;
export type AuthzResource = (typeof AUTHZ_RESOURCE_VALUES)[number];

export const AUTHZ_ACTION_VALUES = [
  'read',
  'read_redacted',
  'read_detailed',
  'create',
  'update',
  'update_governance',
  'delete',
  'archive',
  'export',
  'export_sensitive',
  'reveal',
  'invite',
  'manage',
  'schedule',
  'decide',
  'break_glass',
] as const;
export type AuthzAction = (typeof AUTHZ_ACTION_VALUES)[number];

export type ExportClass =
  | 'organization_profile'
  | 'candidate_packet'
  | 'verification_summary'
  | 'org_audit_extract'
  | 'admin_audit_extract'
  | 'org_structure';
export type CandidateIdentityScope = 'blind' | 'shortlist_identity' | 'full_identity';

export type VerificationSummaryVisibility = 'none' | 'redacted' | 'detailed';
export type AuditMetadataVisibility = 'none' | 'standard' | 'sensitive';

export type AuthzDecision = {
  allowed: boolean;
  reason?: string;
  effectiveRevealScope?: CandidateIdentityScope;
  verificationSummaryVisibility?: VerificationSummaryVisibility;
  auditMetadataVisibility?: AuditMetadataVisibility;
};

type MatrixRule = {
  orgRoles?: readonly OrgRole[];
  platformRoles?: readonly PlatformRole[];
  breakGlassOnly?: boolean;
  notes?: string;
};

export const AUTHZ_MATRIX = {
  org_profile: {
    read: {
      orgRoles: ['viewer', 'member', 'admin', 'owner'],
    },
    update: {
      orgRoles: ['admin', 'owner'],
      notes: 'Non-governance presentation fields only.',
    },
    update_governance: {
      orgRoles: ['owner'],
      notes: 'Legal and ownership fields stay owner-only.',
    },
  },
  org_trust_fields: {
    read_redacted: {
      orgRoles: ['member', 'admin', 'owner'],
    },
    read_detailed: {
      orgRoles: ['admin', 'owner'],
    },
    update: {
      platformRoles: ['platform_admin', 'super_admin'],
      breakGlassOnly: true,
      notes: 'Trust adjudication uses dedicated platform admin flow.',
    },
  },
  assignments: {
    read: {
      orgRoles: ['viewer', 'member', 'admin', 'owner'],
    },
    create: {
      orgRoles: ['admin', 'owner'],
    },
    update: {
      orgRoles: ['admin', 'owner'],
    },
    archive: {
      orgRoles: ['admin', 'owner'],
    },
    export: {
      orgRoles: ['admin', 'owner'],
    },
  },
  candidate_shortlist_cards: {
    read: {
      orgRoles: ['viewer', 'member', 'admin', 'owner'],
      notes: 'Viewer sees blind-only shortlist summaries.',
    },
  },
  candidate_full_review: {
    read: {
      orgRoles: ['member', 'admin', 'owner'],
    },
    update: {
      orgRoles: ['member', 'admin', 'owner'],
    },
  },
  reveal_actions: {
    reveal: {
      orgRoles: ['member', 'admin', 'owner'],
      notes: 'Shortlist reveal is automatic. Full reveal needs downstream trigger.',
    },
    break_glass: {
      platformRoles: ['platform_admin', 'super_admin'],
      breakGlassOnly: true,
    },
  },
  interviews: {
    read: {
      orgRoles: ['member', 'admin', 'owner'],
    },
    schedule: {
      orgRoles: ['member', 'admin', 'owner'],
    },
    update: {
      orgRoles: ['member', 'admin', 'owner'],
    },
  },
  intros_decisions_feedback: {
    read: {
      orgRoles: ['member', 'admin', 'owner'],
    },
    create: {
      orgRoles: ['member', 'admin', 'owner'],
    },
    decide: {
      orgRoles: ['member', 'admin', 'owner'],
    },
  },
  team_invites_memberships: {
    read: {
      orgRoles: ['admin', 'owner'],
    },
    invite: {
      orgRoles: ['admin', 'owner'],
    },
    manage: {
      orgRoles: ['admin', 'owner'],
      notes: 'Owner transfer/reassignment remains owner-only.',
    },
  },
  settings_privacy_defaults: {
    read: {
      orgRoles: ['admin', 'owner'],
    },
    update: {
      orgRoles: ['admin', 'owner'],
    },
  },
  exports: {
    export: {
      orgRoles: ['admin', 'owner'],
    },
    export_sensitive: {
      orgRoles: ['owner'],
      platformRoles: ['platform_admin', 'super_admin'],
      breakGlassOnly: true,
    },
  },
  verification_summaries: {
    read_redacted: {
      orgRoles: ['member', 'admin', 'owner'],
    },
    read_detailed: {
      orgRoles: ['admin', 'owner'],
    },
  },
  org_audit_logs: {
    read: {
      orgRoles: ['admin', 'owner'],
    },
    export: {
      orgRoles: ['owner'],
    },
    break_glass: {
      platformRoles: ['platform_admin', 'super_admin'],
      breakGlassOnly: true,
    },
  },
  admin_audit_logs: {
    read: {
      platformRoles: ['platform_admin', 'super_admin'],
    },
    export: {
      platformRoles: ['platform_admin', 'super_admin'],
    },
  },
} satisfies Record<AuthzResource, Partial<Record<AuthzAction, MatrixRule>>>;

function allowsRule(
  rule: MatrixRule | undefined,
  input: {
    orgRole?: OrgRole | null;
    platformRole?: PlatformRole | null;
    breakGlass?: boolean;
  }
) {
  if (!rule) {
    return false;
  }

  if (rule.breakGlassOnly && !input.breakGlass) {
    return false;
  }

  if (input.platformRole && rule.platformRoles?.includes(input.platformRole)) {
    return true;
  }

  if (input.orgRole && rule.orgRoles?.includes(input.orgRole)) {
    return true;
  }

  return false;
}

export function authorize(input: {
  resource: AuthzResource;
  action: AuthzAction;
  orgRole?: OrgRole | null;
  platformRole?: PlatformRole | null;
  breakGlass?: boolean;
}): AuthzDecision {
  const resourceRules = AUTHZ_MATRIX[input.resource] as Partial<Record<AuthzAction, MatrixRule>>;
  const rule = resourceRules[input.action];
  const allowed = allowsRule(rule, input);

  return allowed
    ? { allowed: true }
    : {
        allowed: false,
        reason: rule?.breakGlassOnly ? 'break_glass_required' : 'insufficient_permissions',
      };
}

export function getVerificationSummaryVisibility(
  orgRole?: OrgRole | null
): VerificationSummaryVisibility {
  if (orgRole === 'admin' || orgRole === 'owner') {
    return 'detailed';
  }
  if (orgRole === 'member') {
    return 'redacted';
  }
  return 'none';
}

export function getAuditMetadataVisibility(orgRole?: OrgRole | null): AuditMetadataVisibility {
  if (orgRole === 'owner') {
    return 'sensitive';
  }
  if (orgRole === 'admin') {
    return 'standard';
  }
  return 'none';
}

export function getEffectiveShortlistRevealScope(
  orgRole: OrgRole | null | undefined,
  storedScope: CandidateIdentityScope
): CandidateIdentityScope {
  if (orgRole === 'viewer') {
    return 'blind';
  }
  return storedScope;
}

export function getEffectiveReviewRevealScope(
  orgRole: OrgRole | null | undefined,
  storedScope: CandidateIdentityScope
): CandidateIdentityScope | null {
  if (!authorize({ resource: 'candidate_full_review', action: 'read', orgRole }).allowed) {
    return null;
  }

  return storedScope;
}

export function canManageTeam(orgRole?: OrgRole | null) {
  return authorize({
    resource: 'team_invites_memberships',
    action: 'manage',
    orgRole,
  }).allowed;
}

export function canInviteTeam(orgRole?: OrgRole | null) {
  return authorize({
    resource: 'team_invites_memberships',
    action: 'invite',
    orgRole,
  }).allowed;
}

export function canMutateAssignments(orgRole?: OrgRole | null) {
  return authorize({
    resource: 'assignments',
    action: 'update',
    orgRole,
  }).allowed;
}

export function canExportOrgData(orgRole?: OrgRole | null, exportClass?: ExportClass) {
  if (exportClass === 'org_audit_extract') {
    return authorize({
      resource: 'org_audit_logs',
      action: 'export',
      orgRole,
    }).allowed;
  }

  return authorize({
    resource: 'exports',
    action: 'export',
    orgRole,
  }).allowed;
}

export function canPlatformBreakGlass(
  platformRole?: PlatformRole | null,
  resource?: AuthzResource,
  action: AuthzAction = 'break_glass'
) {
  if (!resource) {
    return Boolean(platformRole && PLATFORM_ROLE_VALUES.includes(platformRole));
  }

  return authorize({
    resource,
    action,
    platformRole,
    breakGlass: true,
  }).allowed;
}
