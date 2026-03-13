import { NextRequest } from 'next/server';

import { POST as respondToLegacySkillRequest } from '@/app/api/expertise/verification/[requestId]/respond/route';

export function POST(request: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  return respondToLegacySkillRequest(request, { params });
}
