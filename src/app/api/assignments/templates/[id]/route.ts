export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getTemplate } from '@/actions/assignmentTemplates';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('orgId');
  const { id } = await params;

  if (!orgId) {
    return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
  }

  const result = await getTemplate(id, orgId);
  if ('error' in result) {
    const status = result.error === 'Template not found' ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result);
}
