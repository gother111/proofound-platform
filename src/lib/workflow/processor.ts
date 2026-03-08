import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { decisions } from '@/db/schema';
import { log } from '@/lib/log';
import {
  claimWorkflowJobs,
  markWorkflowJobFailure,
  markWorkflowJobSuccess,
} from '@/lib/workflow/queue';
import {
  recordConsentObligationTransition,
  recordDecisionTransition,
  recordIntroWorkflowTransition,
  recordVerificationTransition,
} from '@/lib/workflow/service';

async function processWorkflowJob(
  job: typeof import('@/db/schema').workflowAsyncJobs.$inferSelect
) {
  const payload = (job.payload ?? {}) as Record<string, unknown>;

  switch (job.jobType) {
    case 'decision_reminder':
    case 'intro_reminder':
    case 'verification_follow_up':
    case 'proof_freshness_nudge':
    case 'portfolio_index_refresh':
    case 'consent_prompt':
    case 'workflow_fanout':
      await markWorkflowJobSuccess(job.id, {
        outcome: 'queued_catalog_noop',
        jobType: job.jobType,
      });
      return 'completed';
    case 'expiry_transition': {
      const objectType = String(payload.objectType ?? '');
      if (objectType === 'decision' && job.decisionId) {
        const decision = await db.query.decisions.findFirst({
          where: eq(decisions.id, job.decisionId),
        });
        if (!decision || decision.state !== 'hold' || !decision.latestInterviewId) {
          await markWorkflowJobSuccess(job.id, { outcome: 'suppressed_not_on_hold' });
          return 'suppressed';
        }

        await recordDecisionTransition({
          interviewId: decision.latestInterviewId,
          toState: 'hold_expired',
          actorType: 'system',
          reasonCode: 'hold_window_elapsed',
        });
        await markWorkflowJobSuccess(job.id, { outcome: 'transitioned_hold_expired' });
        return 'completed';
      }

      if (objectType === 'verification' && job.verificationRecordId) {
        await recordVerificationTransition({
          verificationRecordId: job.verificationRecordId,
          toState: 'expired',
          actorType: 'system',
          reasonCode: 'verification_window_elapsed',
        });
        await markWorkflowJobSuccess(job.id, { outcome: 'transitioned_verification_expired' });
        return 'completed';
      }

      if (objectType === 'intro' && job.introWorkflowId) {
        await recordIntroWorkflowTransition({
          introWorkflowId: job.introWorkflowId,
          toState: 'expired',
          actorType: 'system',
          trigger: 'intro_expiry_elapsed',
          reasonCode: 'intro_window_elapsed',
        });
        await markWorkflowJobSuccess(job.id, { outcome: 'transitioned_intro_expired' });
        return 'completed';
      }

      if (objectType === 'consent' && job.consentObligationId) {
        await recordConsentObligationTransition({
          consentObligationId: job.consentObligationId,
          toState: 'expired',
          actorType: 'system',
          trigger: 'consent_expiry_elapsed',
          reasonCode: 'consent_window_elapsed',
        });
        await markWorkflowJobSuccess(job.id, { outcome: 'transitioned_consent_expired' });
        return 'completed';
      }

      await markWorkflowJobFailure(job.id, `Unsupported expiry transition payload: ${objectType}`);
      return 'failed';
    }
    default:
      await markWorkflowJobFailure(job.id, `Unsupported workflow job type: ${job.jobType}`);
      return 'failed';
  }
}

export async function processWorkflowAsyncJobs(batchSize = 100) {
  const jobs = await claimWorkflowJobs(batchSize);
  let completed = 0;
  let failed = 0;
  let suppressed = 0;

  for (const job of jobs) {
    try {
      const outcome = await processWorkflowJob(job as any);
      if (outcome === 'completed') {
        completed += 1;
      } else if (outcome === 'suppressed') {
        suppressed += 1;
      } else {
        failed += 1;
      }
    } catch (error) {
      failed += 1;
      await markWorkflowJobFailure(
        job.id,
        error instanceof Error ? error.message : 'Unknown workflow job error'
      );
    }
  }

  log.info('workflow.jobs.processed', {
    claimed: jobs.length,
    completed,
    suppressed,
    failed,
  });

  return {
    claimed: jobs.length,
    completed,
    suppressed,
    failed,
  };
}
