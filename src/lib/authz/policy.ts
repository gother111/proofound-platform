export const CANONICAL_ORG_ROLE_VALUES = ['org_owner', 'org_manager', 'org_reviewer'] as const;
export const ORG_ROLE_VALUES = [...CANONICAL_ORG_ROLE_VALUES] as const;
export type OrgRole = (typeof CANONICAL_ORG_ROLE_VALUES)[number];
export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  org_owner: 'Owner',
  org_manager: 'Manager',
  org_reviewer: 'Reviewer',
};

export const ORG_ACTIVE_MEMBERSHIP_STATES = ['active'] as const;
export type ActiveMembershipState = (typeof ORG_ACTIVE_MEMBERSHIP_STATES)[number];

export const PLATFORM_ROLE_VALUES = ['platform_admin', 'super_admin'] as const;
export type PlatformRole = (typeof PLATFORM_ROLE_VALUES)[number];

export const PRINCIPAL_TYPE_VALUES = ['individual', 'organization', 'trust_admin'] as const;
export type PrincipalType = (typeof PRINCIPAL_TYPE_VALUES)[number];

export type PrincipalContext = {
  principalType: PrincipalType;
  orgId?: string | null;
};

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
      orgRoles: ['org_reviewer', 'org_manager', 'org_owner'],
    },
    update: {
      orgRoles: ['org_owner'],
      notes: 'Organization configuration remains owner-only in the locked MVP.',
    },
    update_governance: {
      orgRoles: ['org_owner'],
      notes: 'Ownership and trust-tier-sensitive fields stay owner-only.',
    },
  },
  org_trust_fields: {
    read_redacted: {
      orgRoles: ['org_reviewer', 'org_manager', 'org_owner'],
    },
    read_detailed: {
      orgRoles: ['org_manager', 'org_owner'],
    },
    update: {
      platformRoles: ['platform_admin', 'super_admin'],
      breakGlassOnly: true,
      notes: 'Trust adjudication uses audited trust-admin access.',
    },
  },
  assignments: {
    read: {
      orgRoles: ['org_reviewer', 'org_manager', 'org_owner'],
    },
    create: {
      orgRoles: ['org_manager', 'org_owner'],
    },
    update: {
      orgRoles: ['org_manager', 'org_owner'],
    },
    archive: {
      orgRoles: ['org_manager', 'org_owner'],
    },
    export: {
      orgRoles: ['org_manager', 'org_owner'],
    },
  },
  candidate_shortlist_cards: {
    read: {
      orgRoles: ['org_reviewer', 'org_manager', 'org_owner'],
      notes: 'Reviewer scope stays blind or shortlist-limited based on reveal policy.',
    },
  },
  candidate_full_review: {
    read: {
      orgRoles: ['org_reviewer', 'org_manager', 'org_owner'],
    },
    update: {
      orgRoles: ['org_reviewer', 'org_manager', 'org_owner'],
    },
  },
  reveal_actions: {
    reveal: {
      orgRoles: ['org_reviewer', 'org_manager', 'org_owner'],
      notes: 'Reveal remains bounded by workflow and visibility ceilings.',
    },
    break_glass: {
      platformRoles: ['platform_admin', 'super_admin'],
      breakGlassOnly: true,
    },
  },
  interviews: {
    read: {
      orgRoles: ['org_reviewer', 'org_manager', 'org_owner'],
    },
    schedule: {
      orgRoles: ['org_reviewer', 'org_manager', 'org_owner'],
    },
    update: {
      orgRoles: ['org_reviewer', 'org_manager', 'org_owner'],
    },
  },
  intros_decisions_feedback: {
    read: {
      orgRoles: ['org_reviewer', 'org_manager', 'org_owner'],
    },
    create: {
      orgRoles: ['org_reviewer', 'org_manager', 'org_owner'],
    },
    decide: {
      orgRoles: ['org_owner'],
    },
  },
  team_invites_memberships: {
    read: {
      orgRoles: ['org_manager', 'org_owner'],
    },
    invite: {
      orgRoles: ['org_owner'],
    },
    manage: {
      orgRoles: ['org_owner'],
      notes: 'Ownership transfer and membership-state changes remain owner-only.',
    },
  },
  settings_privacy_defaults: {
    read: {
      orgRoles: ['org_manager', 'org_owner'],
    },
    update: {
      orgRoles: ['org_owner'],
    },
  },
  exports: {
    export: {
      orgRoles: ['org_manager', 'org_owner'],
    },
    export_sensitive: {
      orgRoles: ['org_owner'],
      platformRoles: ['platform_admin', 'super_admin'],
      breakGlassOnly: true,
    },
  },
  verification_summaries: {
    read_redacted: {
      orgRoles: ['org_reviewer', 'org_manager', 'org_owner'],
    },
    read_detailed: {
      orgRoles: ['org_manager', 'org_owner'],
    },
  },
  org_audit_logs: {
    read: {
      orgRoles: ['org_manager', 'org_owner'],
    },
    export: {
      orgRoles: ['org_owner'],
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
  if (orgRole === 'org_manager' || orgRole === 'org_owner') {
    return 'detailed';
  }
  if (orgRole === 'org_reviewer') {
    return 'redacted';
  }
  return 'none';
}

export function getAuditMetadataVisibility(orgRole?: OrgRole | null): AuditMetadataVisibility {
  if (orgRole === 'org_owner') {
    return 'sensitive';
  }
  if (orgRole === 'org_manager') {
    return 'standard';
  }
  return 'none';
}

export function getEffectiveShortlistRevealScope(
  orgRole: OrgRole | null | undefined,
  storedScope: CandidateIdentityScope
): CandidateIdentityScope {
  if (orgRole === 'org_reviewer' && storedScope === 'full_identity') {
    return 'shortlist_identity';
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

  if (orgRole === 'org_reviewer' && storedScope === 'full_identity') {
    return 'shortlist_identity';
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

export function isTrustAdminPlatformRole(platformRole?: PlatformRole | null) {
  return Boolean(platformRole && PLATFORM_ROLE_VALUES.includes(platformRole));
}

export function assertExplicitPrincipalContext(
  context: PrincipalContext | null | undefined,
  options: { allowTrustAdmin?: boolean } = {}
) {
  if (!context) {
    return {
      ok: false as const,
      reason: 'missing_principal_context',
    };
  }

  if (context.principalType === 'trust_admin' && !options.allowTrustAdmin) {
    return {
      ok: false as const,
      reason: 'trust_admin_not_allowed',
    };
  }

  if (context.principalType === 'organization' && !context.orgId) {
    return {
      ok: false as const,
      reason: 'organization_principal_requires_org_id',
    };
  }

  return {
    ok: true as const,
  };
}
