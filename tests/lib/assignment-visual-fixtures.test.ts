import { describe, expect, it } from 'vitest';

import {
  buildVisualAssignmentDetailResponse,
  buildVisualAssignmentFixtures,
  VISUAL_ASSIGNMENT_MOCK_ORG_ID,
} from '@/lib/assignments/visual-fixtures';
import { validateAssignmentPublishReadiness } from '@/lib/assignments/publish-validation';

describe('assignment visual fixtures', () => {
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
