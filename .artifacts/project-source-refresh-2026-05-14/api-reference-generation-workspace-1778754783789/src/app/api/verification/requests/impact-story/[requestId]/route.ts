import { NextRequest } from 'next/server';

import {
  deleteImpactVerificationRequest,
  resendImpactVerificationRequest,
} from '@/lib/verification/sent-request-actions';

export function POST(request: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  return params.then(({ requestId }) => resendImpactVerificationRequest(request, requestId));
}

export function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  return params.then(({ requestId }) => deleteImpactVerificationRequest(requestId));
}
