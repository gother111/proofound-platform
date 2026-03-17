import { NextRequest } from 'next/server';

import {
  deleteSkillVerificationRequest,
  resendSkillVerificationRequest,
} from '@/lib/verification/sent-request-actions';

export function POST(request: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  return params.then(({ requestId }) => resendSkillVerificationRequest(request, requestId));
}

export function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  return params.then(({ requestId }) => deleteSkillVerificationRequest(requestId));
}
