import { describe, expect, it } from 'vitest';
import type { AssignmentRequirement, UserSkill } from '../gap';

const noopResources = () => [];

describe('computeSkillGaps', () => {
  it('returns gaps for missing skills', async () => {
    const { computeSkillGaps } = (await import('../gap')) as {
      computeSkillGaps: Function;
    };
    const requirements: AssignmentRequirement[] = [
      {
        assignmentId: 'a1',
        assignmentRole: 'Data Analyst',
        skillCode: 'SQL',
        minLevel: 3,
        weight: 1,
        isRequired: true,
      },
    ];

    const gaps = computeSkillGaps({
      userSkills: [],
      requirements,
      metadata: { SQL: { code: 'SQL', name: 'SQL' } },
      resolveResources: () => [
        { title: 'SQL Basics', url: 'https://example.com/sql', provider: 'Coursera' },
      ],
    });

    expect(gaps).toHaveLength(1);
    expect(gaps[0]).toMatchObject({
      skillCode: 'SQL',
      currentLevel: 0,
      targetLevel: 3,
      gap: 3,
      assignmentCount: 1,
      assignments: ['Data Analyst'],
    });
    expect(gaps[0].learningResources).toHaveLength(1);
  });

  it('skips gaps when the user already meets the requirement', async () => {
    const { computeSkillGaps } = await import('../gap');
    const requirements: AssignmentRequirement[] = [
      {
        assignmentId: 'a1',
        assignmentRole: 'Frontend',
        skillCode: 'TS',
        minLevel: 3,
        weight: 1,
        isRequired: true,
      },
    ];

    const userSkills: UserSkill[] = [{ skillCode: 'TS', level: 4 }];

    const gaps = computeSkillGaps({
      userSkills,
      requirements,
      metadata: { TS: { code: 'TS', name: 'TypeScript' } },
      resolveResources: noopResources,
    });

    expect(gaps).toHaveLength(0);
  });

  it('aggregates multiple assignment requirements into a single gap', async () => {
    const { computeSkillGaps } = await import('../gap');
    const requirements: AssignmentRequirement[] = [
      {
        assignmentId: 'a1',
        assignmentRole: 'Role A',
        skillCode: 'PY',
        minLevel: 2,
        weight: 1,
        isRequired: true,
      },
      {
        assignmentId: 'a2',
        assignmentRole: 'Role B',
        skillCode: 'PY',
        minLevel: 4,
        weight: 2,
        isRequired: true,
      },
    ];

    const userSkills: UserSkill[] = [{ skillCode: 'PY', level: 1 }];

    const gaps = computeSkillGaps({
      userSkills,
      requirements,
      metadata: { PY: { code: 'PY', name: 'Python' } },
      resolveResources: noopResources,
    });

    expect(gaps).toHaveLength(1);
    expect(gaps[0].assignmentCount).toBe(2);
    expect(gaps[0].targetLevel).toBe(4);
    expect(gaps[0].assignments).toContain('Role A');
    expect(gaps[0].assignments).toContain('Role B');
    expect(gaps[0].importance).toBeGreaterThan(0);
  });
});
