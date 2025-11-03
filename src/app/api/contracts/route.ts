import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { contracts, assignments, organizationMembers } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { log } from '@/lib/log';
import { emitContractSigned } from '@/lib/analytics/events';

export const dynamic = 'force-dynamic';

// Validation schema for contract creation/attestation
const ContractSchema = z.object({
  assignmentId: z.string().uuid(),
  userId: z.string().uuid(),
  contractType: z
    .enum(['full-time', 'part-time', 'contract', 'internship', 'volunteer'])
    .optional(),
  signedAt: z.string().datetime().optional(), // ISO datetime string
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional(),
  compensationAmount: z.number().optional(),
  compensationCurrency: z.string().optional(),
  compensationPeriod: z.enum(['hourly', 'weekly', 'monthly', 'yearly', 'one-time']).optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  // Attestation flags
  userAttestation: z.boolean().optional(),
  orgAttestation: z.boolean().optional(),
});

/**
 * GET /api/contracts?userId=... or ?assignmentId=...
 *
 * Fetch contracts for a user or assignment.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const assignmentId = searchParams.get('assignmentId');

    if (!userId && !assignmentId) {
      return NextResponse.json({ error: 'userId or assignmentId is required' }, { status: 400 });
    }

    // Build query conditions
    let conditions: any[] = [];

    if (userId) {
      // User can view their own contracts
      if (userId !== user.id) {
        // Check if user is an org member who can view this user's contracts
        const orgMembership = await db.query.organizationMembers.findFirst({
          where: and(
            eq(organizationMembers.userId, user.id),
            eq(organizationMembers.status, 'active')
          ),
        });

        if (!orgMembership) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        conditions.push(
          and(eq(contracts.userId, userId), eq(contracts.orgId, orgMembership.orgId))
        );
      } else {
        conditions.push(eq(contracts.userId, userId));
      }
    }

    if (assignmentId) {
      // Verify access to assignment
      const assignment = await db.query.assignments.findFirst({
        where: eq(assignments.id, assignmentId),
      });

      if (!assignment) {
        return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
      }

      // Check if user is the candidate or an org member
      const isCandidate = await db.query.contracts.findFirst({
        where: and(eq(contracts.assignmentId, assignmentId), eq(contracts.userId, user.id)),
      });

      const isOrgMember = await db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.userId, user.id),
          eq(organizationMembers.orgId, assignment.orgId),
          eq(organizationMembers.status, 'active')
        ),
      });

      if (!isCandidate && !isOrgMember) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      conditions.push(eq(contracts.assignmentId, assignmentId));
    }

    // Fetch contracts
    const userContracts = await db.query.contracts.findMany({
      where: conditions.length > 0 ? or(...conditions) : undefined,
      orderBy: (contracts, { desc }) => [desc(contracts.signedAt)],
    });

    return NextResponse.json({ items: userContracts });
  } catch (error) {
    log.error('contracts.list.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
  }
}

/**
 * POST /api/contracts
 *
 * Create a new contract or attest to an existing one.
 * If contract exists, update attestation flags.
 * If both parties attest, emit contract_signed event.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // Validate input
    const validatedData = ContractSchema.parse(body);
    const { assignmentId, userId, ...contractDetails } = validatedData;

    // Verify assignment exists
    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, assignmentId),
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Determine if user is the candidate or org member
    const isCandidate = userId === user.id;
    const orgMembership = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.userId, user.id),
        eq(organizationMembers.orgId, assignment.orgId),
        eq(organizationMembers.status, 'active')
      ),
    });

    const isOrgMember = !!orgMembership;

    if (!isCandidate && !isOrgMember) {
      return NextResponse.json(
        { error: 'You must be the candidate or an organization member' },
        { status: 403 }
      );
    }

    // Check if contract already exists
    const existingContract = await db.query.contracts.findFirst({
      where: and(eq(contracts.assignmentId, assignmentId), eq(contracts.userId, userId)),
    });

    let contract;
    let wasAlreadySigned = false;

    if (existingContract) {
      // Update attestation flags
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (isCandidate) {
        updateData.userAttestation = true;
      }

      if (isOrgMember) {
        updateData.orgAttestation = true;
      }

      // Also update other contract details if provided
      if (contractDetails.contractType) updateData.contractType = contractDetails.contractType;
      if (contractDetails.signedAt) updateData.signedAt = new Date(contractDetails.signedAt);
      if (contractDetails.startDate) updateData.startDate = contractDetails.startDate;
      if (contractDetails.endDate) updateData.endDate = contractDetails.endDate;
      if (contractDetails.compensationAmount)
        updateData.compensationAmount = contractDetails.compensationAmount;
      if (contractDetails.compensationCurrency)
        updateData.compensationCurrency = contractDetails.compensationCurrency;
      if (contractDetails.compensationPeriod)
        updateData.compensationPeriod = contractDetails.compensationPeriod;
      if (contractDetails.notes) updateData.notes = contractDetails.notes;
      if (contractDetails.metadata) updateData.metadata = contractDetails.metadata;

      [contract] = await db
        .update(contracts)
        .set(updateData)
        .where(eq(contracts.id, existingContract.id))
        .returning();

      wasAlreadySigned =
        existingContract.userAttestation === true && existingContract.orgAttestation === true;
    } else {
      // Create new contract
      const newContractData = {
        assignmentId,
        userId,
        orgId: assignment.orgId,
        userAttestation: isCandidate ? true : false,
        orgAttestation: isOrgMember ? true : false,
        contractType: contractDetails.contractType || null,
        signedAt: contractDetails.signedAt ? new Date(contractDetails.signedAt) : new Date(),
        startDate: contractDetails.startDate || null,
        endDate: contractDetails.endDate || null,
        compensationAmount: contractDetails.compensationAmount || null,
        compensationCurrency: contractDetails.compensationCurrency || 'USD',
        compensationPeriod: contractDetails.compensationPeriod || null,
        notes: contractDetails.notes || null,
        metadata: contractDetails.metadata || {},
      };

      [contract] = await db.insert(contracts).values(newContractData).returning();
    }

    // Check if both parties have now attested (mutual attestation)
    const mutualAttestation = contract.userAttestation === true && contract.orgAttestation === true;

    // Emit contract_signed event if mutual attestation achieved and not already signed
    if (mutualAttestation && !wasAlreadySigned) {
      try {
        await emitContractSigned(userId, assignmentId, {
          contractType: contract.contractType,
          mutualAttestation: true,
          compensationAmount: contract.compensationAmount,
          compensationCurrency: contract.compensationCurrency,
        });

        log.info('contract.signed', {
          contractId: contract.id,
          assignmentId,
          userId,
          orgId: assignment.orgId,
          mutualAttestation: true,
        });
      } catch (error) {
        log.error('contract-signed-event.failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          contractId: contract.id,
        });
      }
    }

    return NextResponse.json({
      contract,
      mutualAttestation,
      message: mutualAttestation
        ? 'Contract fully signed by both parties'
        : 'Awaiting attestation from other party',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    log.error('contract.create.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to create/update contract' }, { status: 500 });
  }
}
