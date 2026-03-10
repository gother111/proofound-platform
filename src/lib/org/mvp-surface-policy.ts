export type OrgSurfaceStatus = 'mvp' | 'gated_non_mvp' | 'internal_only';

export const ORG_SURFACE_STATUS = {
  home: 'mvp',
  matching: 'mvp',
  assignments: 'mvp',
  profile: 'mvp',
  portfolio: 'mvp',
  candidates: 'gated_non_mvp',
  shortlist: 'gated_non_mvp',
  projects: 'gated_non_mvp',
  team: 'gated_non_mvp',
  members: 'gated_non_mvp',
  settings: 'gated_non_mvp',
  opportunities: 'gated_non_mvp',
  analytics: 'gated_non_mvp',
} as const satisfies Record<string, OrgSurfaceStatus>;

export const ORG_MVP_NAV_ITEMS = [
  {
    hrefSuffix: '/home',
    label: 'Overview',
    icon: 'home',
  },
  {
    hrefSuffix: '/matching',
    label: 'Assignments & Matches',
    icon: 'briefcase',
  },
  {
    hrefSuffix: '/profile',
    label: 'Trust Profile',
    icon: 'building',
  },
  {
    hrefSuffix: '/portfolio',
    label: 'Public Trust Profile',
    icon: 'clipboard',
  },
] as const;

export function getOrgSurfaceStatus(surface: string): OrgSurfaceStatus {
  if (surface in ORG_SURFACE_STATUS) {
    return ORG_SURFACE_STATUS[surface as keyof typeof ORG_SURFACE_STATUS];
  }
  return 'internal_only';
}

export function getOrgSurfaceFallbackHref(slug: string, surface: string): string {
  switch (surface) {
    case 'candidates':
    case 'shortlist':
    case 'opportunities':
      return `/app/o/${slug}/matching`;
    case 'projects':
    case 'team':
    case 'members':
    case 'settings':
    case 'analytics':
      return `/app/o/${slug}/home`;
    default:
      return `/app/o/${slug}/home`;
  }
}
