import { NextRequest } from 'next/server';

import {
  DELETE as deleteLegacySkillRequest,
  POST as resendLegacySkillRequest,
} from '@/app/api/expertise/verifications/sent/[requestType]/[requestId]/route';

export function POST(request: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  return resendLegacySkillRequest(request, {
    params: params.then(({ requestId }) => ({ requestType: 'skill', requestId })),
  });
}

export function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  return deleteLegacySkillRequest(request, {
    params: params.then(({ requestId }) => ({ requestType: 'skill', requestId })),
  });
}
