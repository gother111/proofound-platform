export type RecoveryAction = {
  id: string;
  title: string;
  description: string;
  actionUrl: string;
};

export type RecoveryActionHint = {
  id?: string;
  title?: string;
  description?: string;
  actionUrl?: string;
};

export type IndividualRecoveryContext =
  | 'matching-blocked'
  | 'matching-empty'
  | 'dashboard-empty'
  | 'expertise-empty'
  | 'proofs-empty'
  | 'profile-incomplete';

export type OrganizationRecoveryContext = 'org-matching-empty' | 'assignment-no-matches';

const INDIVIDUAL_BASE_ACTIONS: RecoveryAction[] = [
  {
    id: 'add-proof',
    title: 'Add a proof',
    description: 'Attach a project, credential, or artifact that proves your work.',
    actionUrl: '/app/i/profile?profileView=full&tab=proof_packs',
  },
  {
    id: 'add-skill',
    title: 'Strengthen your Public Page proof',
    description: 'Connect proof items to visible skills so assignment reviews can evaluate fit.',
    actionUrl: '/app/i/profile',
  },
  {
    id: 'turn-on-matchable',
    title: 'Set assignment-review preferences',
    description:
      'Complete work mode, availability, and compensation so assignment reviews stay relevant.',
    actionUrl: '/app/i/matching/preferences',
  },
];

const INDIVIDUAL_DESCRIPTION_OVERRIDES: Record<
  IndividualRecoveryContext,
  Partial<Record<RecoveryAction['id'], string>>
> = {
  'matching-blocked': {
    'turn-on-matchable':
      'Complete work mode, availability, and compensation so assignment reviews can open.',
  },
  'matching-empty': {
    'add-proof': 'Strengthen verification by attaching proof to one of your strongest skills.',
  },
  'dashboard-empty': {
    'add-skill': 'Add a skill so your Proof home can suggest the next useful action.',
  },
  'expertise-empty': {
    'add-skill': 'Start with a skill you can connect to real proof.',
  },
  'proofs-empty': {
    'add-proof': 'Add your first proof artifact to strengthen credibility and readiness.',
  },
  'profile-incomplete': {
    'turn-on-matchable':
      'Finish assignment-review preferences so assignment reviews stay relevant.',
  },
};

function dedupeActions(actions: RecoveryAction[]): RecoveryAction[] {
  const unique: RecoveryAction[] = [];
  for (const action of actions) {
    const exists = unique.some(
      (item) => item.id === action.id || item.actionUrl === action.actionUrl
    );
    if (!exists) {
      unique.push(action);
    }
  }
  return unique;
}

function mapHintToIndividualActionId(hint: RecoveryActionHint): RecoveryAction['id'] | null {
  const title = (hint.title || '').toLowerCase();
  const actionUrl = hint.actionUrl || '';
  const id = (hint.id || '').toLowerCase();

  if (title.includes('proof') || id.includes('proof')) return 'add-proof';
  if (
    title.includes('skill') ||
    id.includes('skill') ||
    actionUrl.includes('tab=proof_packs') ||
    actionUrl.includes('/app/i/profile')
  ) {
    return 'add-skill';
  }
  if (
    title.includes('matchable') ||
    title.includes('matching') ||
    id.includes('matching') ||
    actionUrl.includes('/app/i/matching/preferences')
  ) {
    return 'turn-on-matchable';
  }
  return null;
}

function applyHintOverrides(
  baseActions: RecoveryAction[],
  hints: RecoveryActionHint[] = []
): RecoveryAction[] {
  if (hints.length === 0) {
    return baseActions;
  }

  return baseActions.map((baseAction) => {
    const matchingHint = hints.find((hint) => mapHintToIndividualActionId(hint) === baseAction.id);
    if (!matchingHint) {
      return baseAction;
    }

    return {
      ...baseAction,
      title: matchingHint.title || baseAction.title,
      description: matchingHint.description || baseAction.description,
    };
  });
}

export function getIndividualRecoveryActions(
  context: IndividualRecoveryContext,
  hints: RecoveryActionHint[] = []
): RecoveryAction[] {
  const withContextDescriptions = INDIVIDUAL_BASE_ACTIONS.map((action) => ({
    ...action,
    description: INDIVIDUAL_DESCRIPTION_OVERRIDES[context][action.id] || action.description,
  }));

  const withHints = applyHintOverrides(withContextDescriptions, hints);
  return dedupeActions(withHints).slice(0, 3);
}

function getOrgBasePath(orgSlug?: string | null): string {
  return orgSlug ? `/app/o/${orgSlug}` : '/app/o';
}

export function getOrganizationRecoveryActions(
  context: OrganizationRecoveryContext,
  orgSlug?: string | null,
  assignmentId?: string
): RecoveryAction[] {
  const basePath = getOrgBasePath(orgSlug);
  const assignmentReviewPath =
    orgSlug && assignmentId
      ? `/app/o/${orgSlug}/assignments/${assignmentId}/review`
      : `${basePath}/assignments/new`;

  const byContext: Record<OrganizationRecoveryContext, RecoveryAction[]> = {
    'org-matching-empty': [
      {
        id: 'publish-assignment',
        title: 'Publish assignment',
        description:
          'Create and publish an assignment to start receiving proof-backed submissions.',
        actionUrl: `${basePath}/assignments/new`,
      },
      {
        id: 'add-skill-requirements',
        title: 'Add skill requirements',
        description:
          'Define required skills so assignment review can surface proof-backed submissions.',
        actionUrl: `${basePath}/assignments/new?focus=skills`,
      },
      {
        id: 'turn-on-candidate-matching',
        title: 'Open assignment review',
        description: 'Open the review path so proof submissions can move back into review.',
        actionUrl: `${basePath}/assignments?focus=matchable`,
      },
    ],
    'assignment-no-matches': [
      {
        id: 'publish-assignment',
        title: 'Publish assignment updates',
        description: 'Update and publish this assignment so new submissions can be reviewed.',
        actionUrl: assignmentReviewPath,
      },
      {
        id: 'add-skill-requirements',
        title: 'Add skill requirements',
        description: 'Adjust required skills and levels to improve proof-submission discovery.',
        actionUrl: `${assignmentReviewPath}?focus=skills`,
      },
      {
        id: 'turn-on-candidate-matching',
        title: 'Re-run assignment review',
        description:
          'Re-open assignment review and re-run proof-submission discovery for this assignment.',
        actionUrl: assignmentId
          ? `${basePath}/assignments?matching=${encodeURIComponent(assignmentId)}`
          : `${basePath}/assignments?focus=matchable`,
      },
    ],
  };

  return dedupeActions(byContext[context]).slice(0, 3);
}
