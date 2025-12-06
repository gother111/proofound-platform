export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import {
  AssignmentTemplateInputSchema,
  createTemplate,
  listTemplates,
} from '@/actions/assignmentTemplates';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('orgId');

  if (!orgId) {
    return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
  }

  const result = await listTemplates(orgId);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('orgId');

  if (!orgId) {
    return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
  }

  const body = await req.json();
  const parsed = AssignmentTemplateInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await createTemplate(orgId, parsed.data);
  if ('error' in result) {
    return NextResponse.json(
      { error: result.error, details: (result as any).details },
      { status: 400 }
    );
  }

  return NextResponse.json(result, { status: 201 });
}
