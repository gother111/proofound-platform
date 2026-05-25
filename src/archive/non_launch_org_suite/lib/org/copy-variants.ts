/**
 * Organization Copy Variants
 *
 * Provides type-specific copy and terminology for different organization types.
 * PRD Reference: Part 5 O10 - Organization Type Differentiation
 */

export type OrgType = 'company' | 'ngo' | 'government' | 'academic' | 'cooperative' | 'individual';

interface CopyVariants {
  stakeholders: string;
  stakeholdersPlural: string;
  funding: string;
  fundingPlural: string;
  impact: string;
  impactPlural: string;
  teamLabel: string;
  roleLabel: string;
  outcomeLabel: string;
  revenueLabel: string;
  metricsLabel: string;
  assignmentLabel: string;
  assignmentsLabel: string;
}

/**
 * Copy variants for each organization type
 */
export const ORG_COPY: Record<OrgType, CopyVariants> = {
  company: {
    stakeholders: 'investor',
    stakeholdersPlural: 'investors',
    funding: 'revenue',
    fundingPlural: 'revenue streams',
    impact: 'business outcome',
    impactPlural: 'business outcomes',
    teamLabel: 'Team',
    roleLabel: 'Position',
    outcomeLabel: 'Business Impact',
    revenueLabel: 'Revenue',
    metricsLabel: 'KPIs',
    assignmentLabel: 'Opening',
    assignmentsLabel: 'Openings',
  },
  ngo: {
    stakeholders: 'donor',
    stakeholdersPlural: 'donors',
    funding: 'grant',
    fundingPlural: 'grants',
    impact: 'social impact',
    impactPlural: 'social impacts',
    teamLabel: 'Program Team',
    roleLabel: 'Role',
    outcomeLabel: 'Impact Created',
    revenueLabel: 'Funding',
    metricsLabel: 'Impact Metrics',
    assignmentLabel: 'Opportunity',
    assignmentsLabel: 'Opportunities',
  },
  government: {
    stakeholders: 'constituent',
    stakeholdersPlural: 'constituents',
    funding: 'budget allocation',
    fundingPlural: 'budget allocations',
    impact: 'public outcome',
    impactPlural: 'public outcomes',
    teamLabel: 'Agency',
    roleLabel: 'Position',
    outcomeLabel: 'Public Service',
    revenueLabel: 'Budget',
    metricsLabel: 'Performance Indicators',
    assignmentLabel: 'Position',
    assignmentsLabel: 'Positions',
  },
  academic: {
    stakeholders: 'research partner',
    stakeholdersPlural: 'research partners',
    funding: 'research grant',
    fundingPlural: 'research grants',
    impact: 'research outcome',
    impactPlural: 'research outcomes',
    teamLabel: 'Research Group',
    roleLabel: 'Position',
    outcomeLabel: 'Research Impact',
    revenueLabel: 'Funding',
    metricsLabel: 'Research Metrics',
    assignmentLabel: 'Opening',
    assignmentsLabel: 'Openings',
  },
  cooperative: {
    stakeholders: 'member',
    stakeholdersPlural: 'members',
    funding: 'member contribution',
    fundingPlural: 'member contributions',
    impact: 'cooperative benefit',
    impactPlural: 'cooperative benefits',
    teamLabel: 'Co-op Members',
    roleLabel: 'Role',
    outcomeLabel: 'Member Value',
    revenueLabel: 'Revenue',
    metricsLabel: 'Performance Metrics',
    assignmentLabel: 'Opportunity',
    assignmentsLabel: 'Opportunities',
  },
  individual: {
    stakeholders: 'collaborator',
    stakeholdersPlural: 'collaborators',
    funding: 'income',
    fundingPlural: 'income streams',
    impact: 'project outcome',
    impactPlural: 'project outcomes',
    teamLabel: 'Network',
    roleLabel: 'Role',
    outcomeLabel: 'Project Impact',
    revenueLabel: 'Income',
    metricsLabel: 'Metrics',
    assignmentLabel: 'Project',
    assignmentsLabel: 'Projects',
  },
};

/**
 * Get copy for a specific organization type and key
 */
export function getOrgCopy(
  type: OrgType | string | undefined | null,
  key: keyof CopyVariants
): string {
  const orgType = (type as OrgType) || 'company';
  return ORG_COPY[orgType]?.[key] || ORG_COPY.company[key];
}

/**
 * Get all copy variants for an organization type
 */
export function getOrgCopyVariants(type: OrgType | string | undefined | null): CopyVariants {
  const orgType = (type as OrgType) || 'company';
  return ORG_COPY[orgType] || ORG_COPY.company;
}

/**
 * Helper to get contextual copy with proper article
 */
export function getOrgCopyWithArticle(
  type: OrgType | string | undefined | null,
  key: keyof CopyVariants
): string {
  const word = getOrgCopy(type, key);
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  const article = vowels.includes(word[0].toLowerCase()) ? 'an' : 'a';
  return `${article} ${word}`;
}

/**
 * Format currency based on organization type
 * NGOs might prefer to show funding amounts differently than companies
 */
export function formatOrgCurrency(
  amount: number,
  type: OrgType | string | undefined | null,
  currency = 'USD'
): string {
  const orgType = (type as OrgType) || 'company';

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const formatted = formatter.format(amount);

  // NGOs and government might want to emphasize "grant" or "allocation"
  if (orgType === 'ngo') {
    return `${formatted} in grants`;
  } else if (orgType === 'government') {
    return `${formatted} budget`;
  }

  return formatted;
}
