import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import { assignmentTemplates, organizationMembers } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { log } from '@/lib/log';

const UpdateTemplateSchema = z
  .object({
    name: z.string().min(1).optional(),
    roleFamily: z.string().min(1).optional(),
    summary: z.string().optional(),
    description: z.string().optional(),
    appliesToSteps: z.array(z.string()).optional(),
    payload: z.any().optional(),
    status: z.enum(['active', 'archived']).optional(),
  })
  .partial();

async function userCanAccessOrg(orgId: string | null, userId: string) {
  if (!orgId) return false;
  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.orgId, orgId),
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.status, 'active')
    ),
  });
  return !!membership;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const { id } = await params;

    const template = await db.query.assignmentTemplates.findFirst({
      where: eq(assignmentTemplates.id, id),
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (!template.isGlobal) {
      const allowed = await userCanAccessOrg(template.orgId, user.id);
      if (!allowed) {
        return NextResponse.json(
          { error: 'Not authorized to view this template' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ template });
  } catch (error) {
    log.error('assignment_templates.detail.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to load template' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const { id } = await params;
    const body = await request.json();
    const validated = UpdateTemplateSchema.parse(body);

    const existing = await db.query.assignmentTemplates.findFirst({
      where: eq(assignmentTemplates.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (existing.isGlobal) {
      return NextResponse.json(
        { error: 'Global templates cannot be edited from the app' },
        { status: 403 }
      );
    }

    const allowed = await userCanAccessOrg(existing.orgId, user.id);
    if (!allowed) {
      return NextResponse.json({ error: 'Not authorized to edit this template' }, { status: 403 });
    }

    const updatePayload: Record<string, any> = {};

    if (validated.name !== undefined) updatePayload.name = validated.name;
    if (validated.roleFamily !== undefined) updatePayload.roleFamily = validated.roleFamily;
    if (validated.summary !== undefined) updatePayload.summary = validated.summary;
    if (validated.description !== undefined) updatePayload.description = validated.description;
    if (validated.appliesToSteps !== undefined)
      updatePayload.appliesToSteps = validated.appliesToSteps;
    if (validated.payload !== undefined) updatePayload.presetPayload = validated.payload;
    if (validated.status !== undefined) updatePayload.status = validated.status;
    updatePayload.updatedAt = new Date();

    const [updated] = await db
      .update(assignmentTemplates)
      .set(updatePayload)
      .where(eq(assignmentTemplates.id, id))
      .returning();

    return NextResponse.json({ template: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid template payload', details: error.errors },
        { status: 400 }
      );
    }

    log.error('assignment_templates.update.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}
