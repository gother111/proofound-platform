import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { assignmentInvitations, organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';
import { sendAssignmentInvitationEmail } from '@/lib/email/notifications';

export const dynamic = 'force-dynamic';

const InvitationSchema = z.object({
  orgId: z.string().uuid(),
  stakeholderEmail: z.string().email(),
  stakeholderName: z.string().optional(),
  assignedSections: z.array(z.string()).min(1, 'At least one section must be assigned'),
  message: z.string().optional(),
  expiryDays: z.number().min(1).max(30).default(14),
});

/**
 * POST /api/assignments/invite
 * Create a stakeholder assignment invitation
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = InvitationSchema.parse(body);

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validated.expiryDays);

    // Fetch organization details for email
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, validated.orgId))
      .limit(1);

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Create invitation
    const [invitation] = await db
      .insert(assignmentInvitations)
      .values({
        orgId: validated.orgId,
        token,
        stakeholderEmail: validated.stakeholderEmail,
        stakeholderName: validated.stakeholderName,
        assignedSections: validated.assignedSections,
        message: validated.message,
        expiresAt,
        createdBy: user.id,
      })
      .returning();

    // Generate invitation URL
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/assign/${token}`;

    // Send email invitation
    try {
      await sendAssignmentInvitationEmail({
        to: validated.stakeholderEmail,
        stakeholderName: validated.stakeholderName,
        organizationName: org.displayName,
        assignedSections: validated.assignedSections as string[],
        message: validated.message,
        invitationUrl,
        expiryDate: expiresAt,
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the request if email fails, just log it
    }

    return NextResponse.json({
      invitation,
      invitationUrl,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating invitation:', error);
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
  }
}
