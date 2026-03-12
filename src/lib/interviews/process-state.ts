import type { EngagementVerificationSummary } from '@/lib/engagement-verifications/service';

export function mergeInterviewProcessState<
  T extends {
    id: string;
  },
>(params: {
  interviews: T[];
  decisionStateByInterviewId: Map<string, string>;
  engagementVerificationByInterviewId: Map<string, EngagementVerificationSummary>;
}) {
  return params.interviews.map((interview) => ({
    ...interview,
    decisionState: params.decisionStateByInterviewId.get(interview.id) ?? null,
    engagementVerification: params.engagementVerificationByInterviewId.get(interview.id) ?? null,
  }));
}
