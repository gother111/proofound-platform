import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import type { OrgRole } from '@/lib/authz';
import { isActiveMembershipState, normalizeAuthorizedOrgRole } from '@/lib/authz';
import { createClient } from '@/lib/supabase/server';

export type ApiAuthContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
};

export async function requireApiAuth(): Promise<ApiAuthContext | NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return { supabase, user };
}

export type CanonicalActiveOrgMembership = {
  role: OrgRole;
  state: string | null;
  status: string | null;
};

export function getInternalApiSecret(): string {
  return (process.env.INTERNAL_API_SECRET || process.env.CRON_SECRET || '').trim();
}

export function hasInternalApiSecret(): boolean {
  return getInternalApiSecret().length > 0;
}

export function isTrustedInternalRequest(request: NextRequest): boolean {
  const sharedSecret = getInternalApiSecret();
  if (!sharedSecret) {
    return false;
  }

  const internalHeader = request.headers.get('x-internal-api-key');
  const authorization = request.headers.get('authorization');

  return internalHeader === sharedSecret || authorization === `Bearer ${sharedSecret}`;
}

export function requireInternalApiRequest(request: NextRequest): NextResponse | null {
  if (!hasInternalApiSecret()) {
    return NextResponse.json(
      {
        error: 'Server misconfiguration',
        message: 'Missing INTERNAL_API_SECRET/CRON_SECRET configuration',
      },
      { status: 500 }
    );
  }

  if (!isTrustedInternalRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}

export async function getCanonicalActiveOrgMembership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  orgId: string
): Promise<CanonicalActiveOrgMembership | null> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('role, state, status')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const role = normalizeAuthorizedOrgRole(data.role as string | null | undefined);
  const state = (data.state ?? data.status ?? null) as string | null;

  if (!role || !isActiveMembershipState(state)) {
    return null;
  }

  return {
    role,
    state,
    status: (data.status ?? null) as string | null,
  };
}

export async function isActiveOrgMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  orgId: string,
  roles?: readonly OrgRole[]
): Promise<boolean> {
  const membership = await getCanonicalActiveOrgMembership(supabase, userId, orgId);
  if (!membership) {
    return false;
  }

  if (roles && roles.length > 0) {
    return roles.includes(membership.role);
  }

  return true;
}
