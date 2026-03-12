import { describe, expect, it } from 'vitest';

import { mergeInterviewProcessState } from '@/lib/interviews/process-state';

describe('mergeInterviewProcessState', () => {
  it('keeps decision state and engagement verification as separate projected fields', () => {
    const interviews = [
      {
        id: 'interview-1',
        status: 'completed',
      },
    ];

    const projected = mergeInterviewProcessState({
      interviews,
      decisionStateByInterviewId: new Map([['interview-1', 'hire']]),
      engagementVerificationByInterviewId: new Map([
        [
          'interview-1',
          {
            id: 'engagement-1',
            decisionId: 'decision-1',
            status: 'pending_both_confirmations',
            statusLabel: 'Awaiting both confirmations',
            engagementType: 'full_time',
            candidateConfirmedAt: null,
            organizationConfirmedAt: null,
            uploadedEvidencePresent: false,
            proofHookStatus: 'not_ready',
            verifiedAt: null,
            workflow: {
              state: 'pending_both_confirmations',
              displayState: 'Awaiting both confirmations',
              allowedActions: [
                'pending_candidate_confirmation',
                'pending_organization_confirmation',
                'verified',
              ],
            },
          },
        ],
      ]),
    });

    expect(projected).toEqual([
      expect.objectContaining({
        id: 'interview-1',
        decisionState: 'hire',
        engagementVerification: expect.objectContaining({
          id: 'engagement-1',
          status: 'pending_both_confirmations',
        }),
      }),
    ]);
    expect(projected[0].decisionState).not.toBe(projected[0].engagementVerification?.status);
  });
});
