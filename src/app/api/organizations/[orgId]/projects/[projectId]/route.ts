import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { organizationProjects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ProjectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  impactCreated: z.string().min(1, 'Impact created is required'),
  businessValue: z.string().min(1, 'Business value is required'),
  outcomes: z.string().min(1, 'Outcomes are required'),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
  status: z.enum(['planning', 'active', 'completed', 'on_hold', 'cancelled']),
  isVerified: z.boolean().optional(),
});

interface Params {
  params: {
    orgId: string;
    projectId: string;
  };
}

/**
 * PUT /api/organizations/[orgId]/projects/[projectId]
 * Update a project
 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireAuth();
    const { orgId, projectId } = params;
    const body = await request.json();
    const validated = ProjectSchema.parse(body);

    const [project] = await db
      .update(organizationProjects)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(and(eq(organizationProjects.id, projectId), eq(organizationProjects.orgId, orgId)))
      .returning();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

/**
 * DELETE /api/organizations/[orgId]/projects/[projectId]
 * Delete a project
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await requireAuth();
    const { orgId, projectId } = params;

    const [deleted] = await db
      .delete(organizationProjects)
      .where(and(eq(organizationProjects.id, projectId), eq(organizationProjects.orgId, orgId)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
