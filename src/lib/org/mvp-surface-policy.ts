export type OrgSurfaceStatus = 'mvp' | 'gated_non_mvp' | 'internal_only';

export const ORG_SURFACE_STATUS = {
  home: 'mvp',
  matching: 'mvp',
  assignments: 'mvp',
  communications: 'mvp',
  profile: 'mvp',
  portfolio: 'mvp',
  shortlist: 'mvp',
  candidates: 'mvp',
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
    hrefSuffix: '/assignments',
    label: 'Assignments',
    icon: 'briefcase',
  },
  {
    hrefSuffix: '/candidates',
    label: 'Candidates',
    icon: 'users',
  },
  {
    hrefSuffix: '/communications',
    label: 'Communications',
    icon: 'messageCircle',
  },
  {
    hrefSuffix: '/profile',
    label: 'Organization Profile',
    icon: 'building',
  },
  {
    hrefSuffix: '/portfolio',
    label: 'Public Preview',
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
    case 'opportunities':
      return `/app/o/${slug}/assignments`;
    case 'projects':
    case 'team':
    case 'members':
    case 'settings':
    case 'analytics':
      return `/app/o/${slug}/home`;
    case 'shortlist':
      return `/app/o/${slug}/assignments`;
    default:
      return `/app/o/${slug}/home`;
  }
}
