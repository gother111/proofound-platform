import { NextRequest } from 'next/server';

import {
  DELETE as deleteLegacyImpactRequest,
  POST as resendLegacyImpactRequest,
} from '@/app/api/expertise/verifications/sent/[requestType]/[requestId]/route';

export function POST(request: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  return resendLegacyImpactRequest(request, {
    params: params.then(({ requestId }) => ({ requestType: 'impact_story', requestId })),
  });
}

export function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  return deleteLegacyImpactRequest(request, {
    params: params.then(({ requestId }) => ({ requestType: 'impact_story', requestId })),
  });
}
