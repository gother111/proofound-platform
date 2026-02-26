import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiAuthContext } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { contracts, assignments, organizationMembers, profiles, organizations } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { log } from '@/lib/log';
import { emitContractSigned } from '@/lib/analytics/events';
import { sendContractSignedEmail } from '@/lib/email';
import { notifyContractSigned } from '@/lib/notifications';

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
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
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
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
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

    // Check if contract already exists and create/update in a transaction
    const result = await db.transaction(async (tx) => {
      const existingContract = await tx.query.contracts.findFirst({
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

        [contract] = await tx
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

        [contract] = await tx.insert(contracts).values(newContractData).returning();
      }

      return { contract, wasAlreadySigned };
    });

    const { contract, wasAlreadySigned } = result;

    // Check if both parties have now attested (mutual attestation)
    const mutualAttestation = contract.userAttestation === true && contract.orgAttestation === true;

    // Emit contract_signed event if mutual attestation achieved and not already signed
    if (mutualAttestation && !wasAlreadySigned) {
      try {
        // Calculate days since activation and first intro (if available)
        const { default: daysSinceActivation } = await import('@/lib/analytics/metrics').then(
          (m) => ({ default: 0 })
        ); // TODO: Calculate actual value
        const { default: daysSinceFirstIntro } = await import('@/lib/analytics/metrics').then(
          (m) => ({ default: 0 })
        ); // TODO: Calculate actual value

        await emitContractSigned(userId, contract.id, {
          assignment_id: assignmentId,
          contract_type: (contract.contractType || 'full_time') as
            | 'full_time'
            | 'part_time'
            | 'contract'
            | 'internship'
            | 'volunteer',
          days_since_activation: daysSinceActivation,
          days_since_first_intro: daysSinceFirstIntro,
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

      // Send in-app notifications to both parties
      try {
        // Get candidate profile
        const candidateProfile = await db.query.profiles.findFirst({
          where: eq(profiles.id, userId),
        });

        // Get organization name from organizations table
        const organization = await db.query.organizations.findFirst({
          where: eq(organizations.id, assignment.orgId),
        });
        const orgName = organization?.displayName || 'An organization';

        // Notify the candidate
        await notifyContractSigned(userId, contract.id, orgName);

        // Notify organization members (owners and admins)
        const orgMembers = await db.query.organizationMembers.findMany({
          where: and(
            eq(organizationMembers.orgId, assignment.orgId),
            eq(organizationMembers.status, 'active')
          ),
        });

        const candidateName =
          candidateProfile?.displayName || candidateProfile?.handle || 'A candidate';

        for (const member of orgMembers) {
          if (member.role === 'owner' || member.role === 'admin') {
            try {
              await notifyContractSigned(member.userId, contract.id, candidateName);
            } catch (memberNotifError) {
              log.error('org-member-notification.failed', {
                memberId: member.userId,
                error:
                  memberNotifError instanceof Error ? memberNotifError.message : 'Unknown error',
              });
              // Continue notifying other members
            }
          }
        }
      } catch (notifError) {
        log.error('contract-signed-notification.failed', {
          error: notifError instanceof Error ? notifError.message : 'Unknown error',
          contractId: contract.id,
        });
        // Don't fail the request if notification fails
      }

      // Send email notifications to both parties
      try {
        // Get candidate profile and email from Supabase auth
        const candidateProfile = await db.query.profiles.findFirst({
          where: eq(profiles.id, userId),
        });

        // Get candidate email from Supabase auth
        const supabase = await createClient();
        const { data: authData } = await supabase.auth.admin.getUserById(userId);

        // Send email to candidate
        if (candidateProfile && authData?.user?.email) {
          await sendContractSignedEmail(
            authData.user.email,
            candidateProfile.displayName || 'Candidate',
            'candidate',
            {
              contractType: contract.contractType || 'employment',
              startDate: contract.startDate || undefined,
              compensationAmount: contract.compensationAmount || undefined,
              compensationCurrency: contract.compensationCurrency || 'USD',
              compensationPeriod: contract.compensationPeriod || undefined,
              contractId: contract.id,
            }
          );
        }

        // Send email to organization members (owners and admins)
        const orgMembers = await db.query.organizationMembers.findMany({
          where: and(
            eq(organizationMembers.orgId, assignment.orgId),
            eq(organizationMembers.status, 'active')
          ),
        });

        for (const member of orgMembers) {
          if (member.role === 'owner' || member.role === 'admin') {
            try {
              const { data: memberAuthData } = await supabase.auth.admin.getUserById(member.userId);
              const memberProfile = await db.query.profiles.findFirst({
                where: eq(profiles.id, member.userId),
              });

              if (memberAuthData?.user?.email && memberProfile) {
                await sendContractSignedEmail(
                  memberAuthData.user.email,
                  memberProfile.displayName || 'Organization Member',
                  'organization',
                  {
                    contractType: contract.contractType || 'employment',
                    startDate: contract.startDate || undefined,
                    compensationAmount: contract.compensationAmount || undefined,
                    compensationCurrency: contract.compensationCurrency || 'USD',
                    compensationPeriod: contract.compensationPeriod || undefined,
                    contractId: contract.id,
                  }
                );
              }
            } catch (memberEmailError) {
              log.error('org-member-email.failed', {
                memberId: member.userId,
                error:
                  memberEmailError instanceof Error ? memberEmailError.message : 'Unknown error',
              });
              // Continue emailing other members
            }
          }
        }
      } catch (emailError) {
        log.error('contract-signed-email.failed', {
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
          contractId: contract.id,
        });
        // Don't fail the request if email fails
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
