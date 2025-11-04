import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  assignmentInvitations,
  assignmentSubmissions,
  assignmentVersionHistory,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const SubmissionSchema = z.object({
  sectionName: z.string(),
  sectionData: z.any(),
});

/**
 * GET /api/assignments/[token]
 * Fetch assignment invitation details (public endpoint)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const [invitation] = await db
      .select()
      .from(assignmentInvitations)
      .where(eq(assignmentInvitations.token, token))
      .limit(1);

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 });
    }

    // Check if expired
    if (new Date() > invitation.expiresAt) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 });
    }

    // Fetch existing submissions for this invitation
    const submissions = await db
      .select()
      .from(assignmentSubmissions)
      .where(eq(assignmentSubmissions.invitationId, invitation.id));

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        stakeholderName: invitation.stakeholderName,
        assignedSections: invitation.assignedSections,
        message: invitation.message,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      },
      submissions,
    });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json({ error: 'Failed to fetch assignment' }, { status: 500 });
  }
}

/**
 * POST /api/assignments/[token]
 * Submit assignment data (public endpoint)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const validated = SubmissionSchema.parse(body);

    // Fetch invitation
    const [invitation] = await db
      .select()
      .from(assignmentInvitations)
      .where(eq(assignmentInvitations.token, token))
      .limit(1);

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 });
    }

    // Check if expired
    if (new Date() > invitation.expiresAt) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 });
    }

    // Check if section is assigned
    const assignedSections = invitation.assignedSections as string[] | null;
    if (!assignedSections || !assignedSections.includes(validated.sectionName)) {
      return NextResponse.json(
        { error: 'Section not assigned to this invitation' },
        { status: 403 }
      );
    }

    // Create or update submission
    const [submission] = await db
      .insert(assignmentSubmissions)
      .values({
        invitationId: invitation.id,
        sectionName: validated.sectionName,
        sectionData: validated.sectionData,
      })
      .returning();

    // Create version history entry
    await db.insert(assignmentVersionHistory).values({
      submissionId: submission.id,
      version: 1,
      sectionData: validated.sectionData,
      changedBy: invitation.stakeholderEmail,
    });

    // Update invitation status if all sections are submitted
    const allSubmissions = await db
      .select()
      .from(assignmentSubmissions)
      .where(eq(assignmentSubmissions.invitationId, invitation.id));

    if (allSubmissions.length === (invitation.assignedSections as string[]).length) {
      await db
        .update(assignmentInvitations)
        .set({ status: 'completed', completedAt: new Date() })
        .where(eq(assignmentInvitations.id, invitation.id));
    } else {
      await db
        .update(assignmentInvitations)
        .set({ status: 'in_progress' })
        .where(eq(assignmentInvitations.id, invitation.id));
    }

    return NextResponse.json({ submission });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    console.error('Error submitting assignment:', error);
    return NextResponse.json({ error: 'Failed to submit assignment' }, { status: 500 });
  }
}
