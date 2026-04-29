import type { User } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { organizationMembers, profiles } from '@/db/schema';
import { isActiveMembershipState, normalizeAuthorizedOrgRole, type OrgRole } from '@/lib/authz';
import { createAdminClient } from '@/lib/supabase/admin';
import { mobileError } from '@/lib/api/mobile/response';
import { assertMockDatabaseAllowed, isMockSupabaseEnabled } from '@/lib/env';

type AllowedOrgRole = OrgRole;

type MobileProfile = {
  id: string;
  persona: string | null;
  locale: string | null;
  handle: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  platformRole: string | null;
};

export type MobileAuthContext = {
  user: User;
  accessToken: string;
  profile: MobileProfile | null;
};

function extractBearerToken(request: NextRequest): string | null {
  const authorization = request.headers.get('authorization');
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
    return null;
  }

  return token.trim();
}

export async function requireMobileAuth(
  request: NextRequest
): Promise<MobileAuthContext | NextResponse> {
  const token = extractBearerToken(request);
  if (!token) {
    return mobileError('unauthorized', 'Missing bearer token', 401);
  }

  if (process.env.MOBILE_MOCK_AUTH === 'true' || isMockSupabaseEnabled()) {
    assertMockDatabaseAllowed('Mobile mock auth');

    const mockUserId =
      process.env.MOBILE_MOCK_USER_ID?.trim() || '88888888-8888-4888-8888-888888888888';
    const mockEmail = process.env.MOBILE_MOCK_EMAIL?.trim() || 'mobile-smoke@proofound.io';

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, mockUserId),
      columns: {
        id: true,
        persona: true,
        locale: true,
        handle: true,
        displayName: true,
        avatarUrl: true,
        platformRole: true,
      },
    });

    return {
      user: { id: mockUserId, email: mockEmail } as User,
      accessToken: token,
      profile: profile ?? {
        id: mockUserId,
        persona: 'individual',
        locale: 'en',
        handle: 'mobile-smoke',
        displayName: 'Mobile Smoke User',
        avatarUrl: null,
        platformRole: null,
      },
    };
  }

  const supabaseAdmin = createAdminClient();
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return mobileError('unauthorized', 'Invalid or expired bearer token', 401);
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
    columns: {
      id: true,
      persona: true,
      locale: true,
      handle: true,
      displayName: true,
      avatarUrl: true,
      platformRole: true,
    },
  });

  return {
    user,
    accessToken: token,
    profile: profile ?? null,
  };
}

export async function isActiveOrgMember(
  userId: string,
  orgId: string,
  roles?: readonly AllowedOrgRole[]
): Promise<boolean> {
  const whereBase = and(
    eq(organizationMembers.userId, userId),
    eq(organizationMembers.orgId, orgId),
    eq(organizationMembers.state, 'active')
  );

  if (!whereBase) {
    return false;
  }

  const membership = await db.query.organizationMembers.findFirst({
    where: roles && roles.length > 0 ? whereBase : whereBase,
    columns: { role: true, state: true },
  });

  const role = normalizeAuthorizedOrgRole(membership?.role);
  if (!membership || !isActiveMembershipState(membership.state)) {
    return false;
  }

  if (roles && roles.length > 0) {
    return Boolean(role && roles.includes(role));
  }

  return role !== null;
}

export function requireMobilePlatformAdmin(
  ctx: MobileAuthContext,
  allowPlatformAdmin = true
): NextResponse | null {
  const role = ctx.profile?.platformRole;
  if (role === 'super_admin') {
    return null;
  }

  if (allowPlatformAdmin && role === 'platform_admin') {
    return null;
  }

  return mobileError('forbidden', 'Admin access required', 403);
}
