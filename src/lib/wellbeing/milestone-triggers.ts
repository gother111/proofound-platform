import { log } from '@/lib/log';
import { requireZenOptIn, type ZenMilestoneType } from '@/lib/zen/service';

export type MilestoneType = Extract<ZenMilestoneType, 'rejection' | 'interview' | 'offer'>;

export async function triggerMilestoneReflection(
  userId: string,
  milestoneType: MilestoneType,
  metadata?: Record<string, unknown>
): Promise<void> {
  const optedIn = await requireZenOptIn(userId);
  if (!optedIn) {
    log.info('zen.milestone.skipped_not_opted_in', { userId, milestoneType });
    return;
  }

  // Zen prompts are now UI-derived only. We intentionally do not persist prompt text.
  log.info('zen.milestone.prompt_available', {
    userId,
    milestoneType,
    metadata,
  });
}

export async function triggerRejectionReflection(userId: string, matchId: string): Promise<void> {
  await triggerMilestoneReflection(userId, 'rejection', {
    matchId,
    source: 'match_rejection',
  });
}

export async function triggerInterviewReflection(
  userId: string,
  interviewId: string,
  interviewDate: Date
): Promise<void> {
  await triggerMilestoneReflection(userId, 'interview', {
    interviewId,
    interviewDate: interviewDate.toISOString(),
    source: 'interview_scheduled',
  });
}

export async function triggerOfferReflection(userId: string, contractId: string): Promise<void> {
  await triggerMilestoneReflection(userId, 'offer', {
    contractId,
    source: 'contract_signed',
  });
}
