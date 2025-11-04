import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { contracts, organizationMembers, profiles, organizations, assignments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { log } from '@/lib/log';
import { sendContractSignedEmail } from '@/lib/email/notifications';
import { createClient } from '@/lib/supabase/server';
import { emitContractSigned } from '@/lib/analytics/events';

export const dynamic = 'force-dynamic';

// Validation schema for contract updates
const ContractUpdateSchema = z.object({
  contractType: z
    .enum(['full-time', 'part-time', 'contract', 'internship', 'volunteer'])
    .optional(),
  signedAt: z.string().datetime().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  compensationAmount: z.number().optional(),
  compensationCurrency: z.string().optional(),
  compensationPeriod: z.enum(['hourly', 'weekly', 'monthly', 'yearly', 'one-time']).optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  userAttestation: z.boolean().optional(),
  orgAttestation: z.boolean().optional(),
});

/**
 * Helper to verify user has access to contract
 */
async function verifyContractAccess(userId: string, contractId: string): Promise<boolean> {
  const contract = await db.query.contracts.findFirst({
    where: eq(contracts.id, contractId),
  });

  if (!contract) {
    return false;
  }

  // User can access their own contract
  if (contract.userId === userId) {
    return true;
  }

  // Org member can access their org's contracts
  const orgMembership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.orgId, contract.orgId),
      eq(organizationMembers.status, 'active')
    ),
  });

  return !!orgMembership;
}

/**
 * GET /api/contracts/[id]
 *
 * Get a specific contract by ID.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let contractId: string | undefined;
  try {
    const user = await requireAuth();
    const resolvedParams = await params;
    contractId = resolvedParams.id;

    // Verify access
    const hasAccess = await verifyContractAccess(user.id, contractId);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Contract not found or access denied' }, { status: 404 });
    }

    // Fetch contract
    const contract = await db.query.contracts.findFirst({
      where: eq(contracts.id, contractId),
    });

    return NextResponse.json({ contract });
  } catch (error) {
    log.error('contract.get.failed', {
      contractId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 });
  }
}

/**
 * PATCH /api/contracts/[id]
 *
 * Update a contract (e.g., add attestation, update details).
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let contractId: string | undefined;
  try {
    const user = await requireAuth();
    const resolvedParams = await params;
    contractId = resolvedParams.id;

    // Verify access
    const hasAccess = await verifyContractAccess(user.id, contractId);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Contract not found or access denied' }, { status: 404 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = ContractUpdateSchema.parse(body);

    // Fetch existing contract to check who is updating
    const existingContract = await db.query.contracts.findFirst({
      where: eq(contracts.id, contractId),
    });

    if (!existingContract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Determine if user is candidate or org member
    const isCandidate = existingContract.userId === user.id;
    const isOrgMember = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.userId, user.id),
        eq(organizationMembers.orgId, existingContract.orgId),
        eq(organizationMembers.status, 'active')
      ),
    });

    // Build update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only allow attestation updates for the respective party
    if (isCandidate && validatedData.userAttestation !== undefined) {
      updateData.userAttestation = validatedData.userAttestation;
    }

    if (isOrgMember && validatedData.orgAttestation !== undefined) {
      updateData.orgAttestation = validatedData.orgAttestation;
    }

    // Allow other fields to be updated by either party
    if (validatedData.contractType) updateData.contractType = validatedData.contractType;
    if (validatedData.signedAt) updateData.signedAt = new Date(validatedData.signedAt);
    if (validatedData.startDate) updateData.startDate = validatedData.startDate;
    if (validatedData.endDate) updateData.endDate = validatedData.endDate;
    if (validatedData.compensationAmount)
      updateData.compensationAmount = validatedData.compensationAmount;
    if (validatedData.compensationCurrency)
      updateData.compensationCurrency = validatedData.compensationCurrency;
    if (validatedData.compensationPeriod)
      updateData.compensationPeriod = validatedData.compensationPeriod;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
    if (validatedData.metadata) updateData.metadata = validatedData.metadata;

    // Update contract
    const [updatedContract] = await db
      .update(contracts)
      .set(updateData)
      .where(eq(contracts.id, contractId))
      .returning();

    log.info('contract.updated', {
      contractId,
      userId: user.id,
      isCandidate,
      isOrgMember: !!isOrgMember,
    });

    // Send email notification if contract is now fully signed
    if (updatedContract.userAttestation && updatedContract.orgAttestation) {
      // Check if this update just completed the signing
      const wasJustSigned =
        existingContract.userAttestation !== updatedContract.userAttestation ||
        existingContract.orgAttestation !== updatedContract.orgAttestation;

      if (wasJustSigned) {
        try {
          const supabase = await createClient();

          // Get candidate profile
          const candidateProfile = await db.query.profiles.findFirst({
            where: eq(profiles.id, updatedContract.userId),
          });

          // Get candidate email from Supabase auth
          const { data: authData } = await supabase.auth.admin.getUserById(
            updatedContract.userId
          );

          // Get organization name
          const org = await db.query.organizations.findFirst({
            where: eq(organizations.id, updatedContract.orgId),
          });

          // Get assignment details
          const assignment = await db.query.assignments.findFirst({
            where: eq(assignments.id, updatedContract.assignmentId),
          });

          // Emit contract signed analytics event for TTSC tracking
          try {
            await emitContractSigned(updatedContract.userId, updatedContract.assignmentId, {
              contractType: updatedContract.contractType,
              contractId: updatedContract.id,
            });
          } catch (analyticsError) {
            console.error('Failed to emit contract signed event:', analyticsError);
            // Don't fail the request if analytics fails
          }

          // Send email to candidate
          if (candidateProfile && authData?.user?.email && org) {
            await sendContractSignedEmail({
              to: authData.user.email,
              candidateName: candidateProfile.displayName || 'Candidate',
              organizationName: org.displayName,
              contractType: updatedContract.contractType || 'employment',
              assignmentTitle: assignment?.role,
              nextSteps:
                'You will receive further details from the organization shortly about your start date and onboarding process.',
            });
          }
        } catch (emailError) {
          console.error('Failed to send contract signed email:', emailError);
          // Don't fail the request if email fails
        }
      }
    }

    return NextResponse.json({ contract: updatedContract });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    log.error('contract.update.failed', {
      contractId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 });
  }
}

/**
 * DELETE /api/contracts/[id]
 *
 * Delete a contract (admin/org only).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let contractId: string | undefined;
  try {
    const user = await requireAuth();
    const resolvedParams = await params;
    contractId = resolvedParams.id;

    // Verify contract exists and user is org member
    const contract = await db.query.contracts.findFirst({
      where: eq(contracts.id, contractId),
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const isOrgMember = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.userId, user.id),
        eq(organizationMembers.orgId, contract.orgId),
        eq(organizationMembers.status, 'active')
      ),
    });

    if (!isOrgMember) {
      return NextResponse.json(
        { error: 'Only organization members can delete contracts' },
        { status: 403 }
      );
    }

    // Delete contract
    await db.delete(contracts).where(eq(contracts.id, contractId));

    log.info('contract.deleted', {
      contractId,
      userId: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('contract.delete.failed', {
      contractId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to delete contract' }, { status: 500 });
  }
}
