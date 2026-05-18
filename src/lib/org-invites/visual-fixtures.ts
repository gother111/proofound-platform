export const VISUAL_ORG_INVITE_TOKENS = {
  pending: 'visual-org-member-invite-000000001',
} as const;

export function orgInviteVisualFixturesEnabled() {
  return (
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true' &&
    process.env.PROOFOUND_VISUAL_FIXTURES === 'true' &&
    process.env.VERCEL_ENV !== 'production'
  );
}

export function buildVisualOrgInvite(token: string) {
  if (token !== VISUAL_ORG_INVITE_TOKENS.pending) {
    return null;
  }

  return {
    token,
    organization: {
      slug: 'northstar-evidence',
      displayName: 'Northstar Evidence Studio',
      mission:
        'Review proof-first candidate evidence for privacy-sensitive hiring pilots without exposing more than the team needs.',
    },
    role: 'org reviewer',
    email: 'elena.reviewer@northstar-evidence.example',
    workspaceHref: '/app/o/northstar-evidence/home',
  };
}
