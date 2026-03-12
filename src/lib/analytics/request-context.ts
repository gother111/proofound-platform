import { NextRequest, NextResponse } from 'next/server';
import { isActiveOrgMember, isTrustedInternalRequest, requireApiAuth } from '@/lib/api/auth';
import { requireAnalyticsConsentForUser } from '@/lib/privacy/analytics-consent';

type ResolveAnalyticsRequestContextInput = {
  requestedUserId?: string;
  requestedOrgId?: string;
};

export type ResolvedAnalyticsRequestContext = {
  trustedInternalCall: boolean;
  resolvedUserId?: string;
  resolvedOrgId?: string;
};

export async function resolveAnalyticsRequestContext(
  request: NextRequest,
  input: ResolveAnalyticsRequestContextInput
): Promise<ResolvedAnalyticsRequestContext | NextResponse> {
  const trustedInternalCall = isTrustedInternalRequest(request);
  const authResult = await requireApiAuth();

  if (!trustedInternalCall && authResult instanceof NextResponse) {
    return authResult;
  }

  const authContext = authResult instanceof NextResponse ? null : authResult;
  const resolvedUserId = trustedInternalCall ? input.requestedUserId : authContext!.user.id;

  if (!trustedInternalCall && resolvedUserId) {
    const hasAnalyticsConsent = await requireAnalyticsConsentForUser(resolvedUserId);
    if (!hasAnalyticsConsent) {
      return NextResponse.json(
        { success: true, skipped: 'analytics_consent_missing' },
        { status: 202 }
      );
    }
  }

  let resolvedOrgId: string | undefined;
  if (input.requestedOrgId) {
    if (trustedInternalCall) {
      resolvedOrgId = input.requestedOrgId;
    } else if (
      await isActiveOrgMember(authContext!.supabase, authContext!.user.id, input.requestedOrgId, [
        'org_owner',
        'org_manager',
        'org_reviewer',
      ])
    ) {
      resolvedOrgId = input.requestedOrgId;
    } else {
      return NextResponse.json(
        { error: 'Forbidden: orgId is not accessible for current user' },
        { status: 403 }
      );
    }
  }

  return {
    trustedInternalCall,
    resolvedUserId,
    resolvedOrgId,
  };
}
