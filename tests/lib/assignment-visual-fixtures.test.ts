import { describe, expect, it } from 'vitest';

import {
  buildVisualAssignmentDetailResponse,
  buildVisualAssignmentFixtures,
  VISUAL_ASSIGNMENT_MOCK_ORG_ID,
} from '@/lib/assignments/visual-fixtures';
import { validateAssignmentPublishReadiness } from '@/lib/assignments/publish-validation';

describe('assignment visual fixtures', () => {
  it('keeps visual assignment dates deterministic for screenshot QA', () => {
    const firstRun = buildVisualAssignmentFixtures(VISUAL_ASSIGNMENT_MOCK_ORG_ID);
    const secondRun = buildVisualAssignmentFixtures(VISUAL_ASSIGNMENT_MOCK_ORG_ID);
    const activeFixture = firstRun.find((fixture) => fixture.status === 'active');

    expect(firstRun.map((fixture) => fixture.createdAt)).toEqual(
      secondRun.map((fixture) => fixture.createdAt)
    );
    expect(activeFixture?.createdAt).toBe('2026-06-13T12:00:00.000Z');
    expect(activeFixture?.matchingSummary.lastActivityAt).toBe('2026-06-17T09:00:00.000Z');
  });

  it('keeps the draft review fixture publish-ready for rendered publish confirmation QA', () => {
    const draftFixture = buildVisualAssignmentFixtures(VISUAL_ASSIGNMENT_MOCK_ORG_ID).find(
      (fixture) => fixture.status === 'draft'
    );

    expect(draftFixture).toBeDefined();

    const assignment = buildVisualAssignmentDetailResponse(draftFixture!);
    const result = validateAssignmentPublishReadiness({
      assignment: assignment as any,
      outcomesCount: assignment.outcomes.length,
      assignmentBasicModeEnabled: true,
      organization: { trustStatus: 'domain_verified' } as any,
    });

    expect(result.canPublish).toBe(true);
    expect(result.blocks).toEqual([]);
  });
});
