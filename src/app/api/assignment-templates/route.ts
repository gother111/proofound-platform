import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { assignmentTemplates, organizationMembers, organizations } from '@/db/schema';
import { and, eq, or, desc } from 'drizzle-orm';
import { log } from '@/lib/log';

const DEFAULT_APPLIES_TO_STEPS = [
  'business_value',
  'outcomes',
  'weights',
  'practicals',
  'expertise',
];

const TemplatePayloadSchema = z.object({
  role: z.string().optional(),
  businessValue: z.string().optional(),
  expectedImpact: z.string().optional(),
  stakeholders: z.array(z.string()).optional(),
  outcomes: z
    .array(
      z.object({
        metric: z.string(),
        target: z.string(),
        timeframe: z.string(),
      })
    )
    .optional(),
  weights: z
    .object({
      mission: z.number().min(0).max(100),
      expertise: z.number().min(0).max(100),
      workMode: z.number().min(0).max(100),
    })
    .optional(),
  workModeRequirement: z.enum(['hard', 'soft']).optional(),
  workModePreference: z.enum(['onsite', 'hybrid', 'remote']).optional(),
  locationMode: z.enum(['onsite', 'hybrid', 'remote']).optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  compMin: z.number().optional(),
  compMax: z.number().optional(),
  currency: z.string().optional(),
  hoursMin: z.number().optional(),
  hoursMax: z.number().optional(),
  startEarliest: z.string().optional(),
  startLatest: z.string().optional(),
  duration: z.string().optional(),
  verificationGates: z.array(z.string()).optional(),
  mustHaveSkills: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().optional(),
        level: z.number().min(1).max(5).optional(),
        linkedToBV: z.boolean().optional(),
        linkedToTO: z.boolean().optional(),
      })
    )
    .optional(),
  niceToHaveSkills: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().optional(),
        level: z.number().min(1).max(5).optional(),
      })
    )
    .optional(),
  educationRequired: z.boolean().optional(),
  educationJustification: z.string().optional(),
});

const TemplateSchema = z.object({
  name: z.string().min(1),
  roleFamily: z.string().min(1),
  summary: z.string().optional(),
  description: z.string().optional(),
  appliesToSteps: z.array(z.string()).default(DEFAULT_APPLIES_TO_STEPS),
  payload: TemplatePayloadSchema,
  status: z.enum(['active', 'archived']).default('active'),
});

async function resolveOrgIdForUser(userId: string, orgSlug?: string | null) {
  if (orgSlug) {
    const orgRow = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, orgSlug))
      .limit(1);

    const org = orgRow[0];
    if (!org) {
      return null;
    }

    const membership = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.orgId, org.id),
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.status, 'active')
      ),
    });

    return membership ? org.id : null;
  }

  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.status, 'active')
    ),
  });

  return membership?.orgId ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const orgSlug = searchParams.get('orgSlug');
    const roleFamily = searchParams.get('roleFamily');
    const orgId = await resolveOrgIdForUser(user.id, orgSlug);

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization not found or access denied' },
        { status: 403 }
      );
    }

    const whereClause = roleFamily
      ? and(
          or(eq(assignmentTemplates.isGlobal, true), eq(assignmentTemplates.orgId, orgId)),
          eq(assignmentTemplates.status, 'active'),
          eq(assignmentTemplates.roleFamily, roleFamily)
        )
      : and(
          or(eq(assignmentTemplates.isGlobal, true), eq(assignmentTemplates.orgId, orgId)),
          eq(assignmentTemplates.status, 'active')
        );

    const templates = await db
      .select({
        id: assignmentTemplates.id,
        name: assignmentTemplates.name,
        roleFamily: assignmentTemplates.roleFamily,
        summary: assignmentTemplates.summary,
        description: assignmentTemplates.description,
        appliesToSteps: assignmentTemplates.appliesToSteps,
        presetPayload: assignmentTemplates.presetPayload,
        isGlobal: assignmentTemplates.isGlobal,
        status: assignmentTemplates.status,
        createdAt: assignmentTemplates.createdAt,
      })
      .from(assignmentTemplates)
      .where(whereClause)
      .orderBy(desc(assignmentTemplates.createdAt));

    return NextResponse.json({ items: templates });
  } catch (error) {
    log.error('assignment_templates.list.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Failed to load templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const orgSlug = searchParams.get('orgSlug');
    const orgId = await resolveOrgIdForUser(user.id, orgSlug);

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization not found or access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = TemplateSchema.parse(body);

    const [template] = await db
      .insert(assignmentTemplates)
      .values({
        orgId,
        name: validated.name,
        roleFamily: validated.roleFamily,
        summary: validated.summary,
        description: validated.description,
        appliesToSteps:
          validated.appliesToSteps && validated.appliesToSteps.length > 0
            ? validated.appliesToSteps
            : DEFAULT_APPLIES_TO_STEPS,
        presetPayload: validated.payload,
        isGlobal: false,
        status: validated.status || 'active',
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid template payload', details: error.errors },
        { status: 400 }
      );
    }

    log.error('assignment_templates.create.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

