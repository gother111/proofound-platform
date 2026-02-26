/**
 * Projects API Route
 *
 * GET - List user's projects with optional filters
 * POST - Create new project
 *
 * Used by ProjectsCard dashboard widget
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import { projects, organizations } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Schema for creating a new project
const CreateProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  projectType: z.enum(['work', 'volunteer', 'education', 'side_project', 'hobby']),
  status: z.enum(['ongoing', 'concluded', 'paused', 'archived']).default('ongoing'),
  startDate: z.string(), // ISO date string
  endDate: z.string().optional().nullable(),
  organizationName: z.string().max(200).optional().nullable(),
  roleTitle: z.string().max(200).optional().nullable(),
  impactSummary: z.string().max(1000).optional().nullable(),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(['public', 'network', 'private']).default('public'),
});

export async function GET(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);

    // Build where clause
    let whereClause = eq(projects.userId, user.id);

    if (type && ['work', 'volunteer', 'education', 'side_project', 'hobby'].includes(type)) {
      whereClause = and(eq(projects.userId, user.id), eq(projects.projectType, type as any))!;
    }

    if (status && ['ongoing', 'concluded', 'paused', 'archived'].includes(status)) {
      whereClause = and(whereClause, eq(projects.status, status as any))!;
    }

    // Fetch projects
    const userProjects = await db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        projectType: projects.projectType,
        status: projects.status,
        startDate: projects.startDate,
        endDate: projects.endDate,
        organizationName: projects.organizationName,
        organizationId: projects.organizationId,
        roleTitle: projects.roleTitle,
        impactSummary: projects.impactSummary,
        outcomes: projects.outcomes,
        verified: projects.verified,
        artifacts: projects.artifacts,
        tags: projects.tags,
        visibility: projects.visibility,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .where(whereClause)
      .orderBy(desc(projects.startDate))
      .limit(limit);

    // Calculate stats
    const allProjects = await db
      .select({
        status: projects.status,
        count: sql<number>`count(*)::int`,
      })
      .from(projects)
      .where(eq(projects.userId, user.id))
      .groupBy(projects.status);

    const stats = {
      total: allProjects.reduce((sum, p) => sum + (p.count || 0), 0),
      ongoing: allProjects.find((p) => p.status === 'ongoing')?.count || 0,
      concluded: allProjects.find((p) => p.status === 'concluded')?.count || 0,
      paused: allProjects.find((p) => p.status === 'paused')?.count || 0,
    };

    return NextResponse.json({ projects: userProjects, stats });
  } catch (error) {
    console.error('Error in GET /api/projects:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch projects',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const body = await request.json();

    // Validate input
    const validatedData = CreateProjectSchema.parse(body);

    // Insert project
    const [newProject] = await db
      .insert(projects)
      .values({
        userId: user.id,
        title: validatedData.title,
        description: validatedData.description,
        projectType: validatedData.projectType,
        status: validatedData.status,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        organizationName: validatedData.organizationName,
        roleTitle: validatedData.roleTitle,
        impactSummary: validatedData.impactSummary,
        tags: validatedData.tags || [],
        visibility: validatedData.visibility,
      })
      .returning();

    return NextResponse.json({ success: true, project: newProject }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid project data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in POST /api/projects:', error);
    return NextResponse.json(
      {
        error: 'Failed to create project',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
