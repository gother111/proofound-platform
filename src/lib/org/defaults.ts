/**
 * Organization Type-Specific Defaults
 *
 * Provides appropriate default settings based on organization type.
 * PRD Reference: Part 5 O10 - Organization Type Differentiation
 */

import { type OrgType } from './copy-variants';

interface OrgDefaults {
  defaultVisibility: 'public' | 'network' | 'private';
  defaultMatchingMode: 'active' | 'passive';
  emphasizeImpact: boolean;
  emphasizeCompliance: boolean;
  emphasizeROI: boolean;
  suggestedFields: string[]; // Fields to highlight during setup
  recommendedDashboardWidgets: string[];
}

/**
 * Default settings for each organization type
 */
export const ORG_DEFAULTS: Record<OrgType, OrgDefaults> = {
  company: {
    defaultVisibility: 'private',
    defaultMatchingMode: 'active',
    emphasizeImpact: false,
    emphasizeCompliance: false,
    emphasizeROI: true,
    suggestedFields: ['mission', 'values', 'workCulture', 'impactEntries'],
    recommendedDashboardWidgets: [
      'ttsc-trend',
      'next-actions',
      'team-coverage',
      'active-assignments',
    ],
  },
  ngo: {
    defaultVisibility: 'public',
    defaultMatchingMode: 'active',
    emphasizeImpact: true,
    emphasizeCompliance: false,
    emphasizeROI: false,
    suggestedFields: ['mission', 'vision', 'causes', 'impactEntries', 'partnerships'],
    recommendedDashboardWidgets: [
      'impact-metrics',
      'donor-engagement',
      'volunteer-hours',
      'active-projects',
    ],
  },
  government: {
    defaultVisibility: 'public',
    defaultMatchingMode: 'passive',
    emphasizeImpact: true,
    emphasizeCompliance: true,
    emphasizeROI: false,
    suggestedFields: ['mission', 'values', 'transparencyMetrics', 'publicOutcomes'],
    recommendedDashboardWidgets: [
      'compliance-status',
      'audit-trail',
      'public-outcomes',
      'budget-tracking',
    ],
  },
  academic: {
    defaultVisibility: 'public',
    defaultMatchingMode: 'passive',
    emphasizeImpact: true,
    emphasizeCompliance: false,
    emphasizeROI: false,
    suggestedFields: ['mission', 'researchAreas', 'publications', 'collaborations'],
    recommendedDashboardWidgets: [
      'research-output',
      'collaboration-network',
      'grant-tracking',
      'citations',
    ],
  },
  cooperative: {
    defaultVisibility: 'network',
    defaultMatchingMode: 'passive',
    emphasizeImpact: true,
    emphasizeCompliance: false,
    emphasizeROI: false,
    suggestedFields: ['mission', 'values', 'governance', 'memberBenefits'],
    recommendedDashboardWidgets: [
      'member-satisfaction',
      'revenue-sharing',
      'governance-metrics',
      'cooperative-impact',
    ],
  },
  individual: {
    defaultVisibility: 'network',
    defaultMatchingMode: 'active',
    emphasizeImpact: false,
    emphasizeCompliance: false,
    emphasizeROI: false,
    suggestedFields: ['mission', 'expertise', 'portfolio', 'availability'],
    recommendedDashboardWidgets: [
      'active-projects',
      'skill-development',
      'network-connections',
      'project-outcomes',
    ],
  },
};

/**
 * Get defaults for an organization type
 */
export function getOrgDefaults(type: OrgType | string | undefined | null): OrgDefaults {
  const orgType = (type as OrgType) || 'company';
  return ORG_DEFAULTS[orgType] || ORG_DEFAULTS.company;
}

/**
 * Get visibility preferences for profile fields based on org type
 */
export function getFieldVisibilityDefaults(
  type: OrgType | string | undefined | null
): Record<string, 'public' | 'network' | 'private'> {
  const orgType = (type as OrgType) || 'company';

  const baseDefaults = {
    company: {
      mission: 'public',
      vision: 'network',
      values: 'public',
      causes: 'network',
      workCulture: 'network',
      team: 'private',
      impactEntries: 'network',
      partnerships: 'network',
      revenue: 'private',
    },
    ngo: {
      mission: 'public',
      vision: 'public',
      values: 'public',
      causes: 'public',
      workCulture: 'public',
      team: 'public',
      impactEntries: 'public',
      partnerships: 'public',
      revenue: 'public', // NGOs often show funding publicly
    },
    government: {
      mission: 'public',
      vision: 'public',
      values: 'public',
      causes: 'public',
      workCulture: 'public',
      team: 'public',
      impactEntries: 'public',
      partnerships: 'public',
      revenue: 'public', // Budget transparency
    },
    academic: {
      mission: 'public',
      vision: 'public',
      values: 'public',
      causes: 'public',
      workCulture: 'network',
      team: 'public',
      impactEntries: 'public',
      partnerships: 'public',
      revenue: 'network',
    },
    cooperative: {
      mission: 'public',
      vision: 'network',
      values: 'public',
      causes: 'public',
      workCulture: 'network',
      team: 'network', // Members-only
      impactEntries: 'network',
      partnerships: 'network',
      revenue: 'network', // Members-only
    },
    individual: {
      mission: 'network',
      vision: 'network',
      values: 'network',
      causes: 'network',
      workCulture: 'network',
      team: 'network',
      impactEntries: 'network',
      partnerships: 'network',
      revenue: 'private',
    },
  };

  return (baseDefaults[orgType] || baseDefaults.company) as Record<
    string,
    'public' | 'network' | 'private'
  >;
}

/**
 * Get onboarding checklist items based on org type
 */
export function getOnboardingChecklist(type: OrgType | string | undefined | null): Array<{
  id: string;
  label: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}> {
  const orgType = (type as OrgType) || 'company';

  const baseChecklists = {
    company: [
      {
        id: 'mission',
        label: 'Define your mission',
        description: 'What problem does your company solve?',
        priority: 'high' as const,
      },
      {
        id: 'values',
        label: 'Set company values',
        description: 'What principles guide your work?',
        priority: 'high' as const,
      },
      {
        id: 'culture',
        label: 'Describe work culture',
        description: 'What is it like to work here?',
        priority: 'medium' as const,
      },
      {
        id: 'first-assignment',
        label: 'Post first opening',
        description: 'Start finding great talent',
        priority: 'high' as const,
      },
    ],
    ngo: [
      {
        id: 'mission',
        label: 'Define your mission',
        description: 'What social impact do you create?',
        priority: 'high' as const,
      },
      {
        id: 'causes',
        label: 'Select your causes',
        description: 'What issues do you address?',
        priority: 'high' as const,
      },
      {
        id: 'impact',
        label: 'Share impact stories',
        description: 'Show the difference you make',
        priority: 'high' as const,
      },
      {
        id: 'first-assignment',
        label: 'Post first opportunity',
        description: 'Start building your team',
        priority: 'medium' as const,
      },
    ],
    government: [
      {
        id: 'mission',
        label: 'Define agency mission',
        description: 'What public service do you provide?',
        priority: 'high' as const,
      },
      {
        id: 'compliance',
        label: 'Set compliance standards',
        description: 'Define required certifications',
        priority: 'high' as const,
      },
      {
        id: 'transparency',
        label: 'Enable transparency',
        description: 'Make key information public',
        priority: 'high' as const,
      },
      {
        id: 'first-position',
        label: 'Post first position',
        description: 'Start recruiting',
        priority: 'medium' as const,
      },
    ],
  };

  return baseChecklists[orgType] || baseChecklists.company;
}
