import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import type { OrgRole } from '@/lib/authz';
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

export async function isActiveOrgMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  orgId: string,
  roles?: OrgRole[]
): Promise<boolean> {
  let query = supabase
    .from('organization_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1);

  if (roles && roles.length > 0) {
    query = query.in('role', roles);
  }

  const { data, error } = await query;

  if (error) {
    return false;
  }

  return Array.isArray(data) && data.length > 0;
}
