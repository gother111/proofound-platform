#!/usr/bin/env node
import { computeSkillGaps } from '../src/lib/skills/gap-service';

type Row = Record<string, any>;

const makeBuilder = (rows: Row[]) => {
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: (n?: number) =>
      Promise.resolve({ data: typeof n === 'number' ? rows.slice(0, n) : rows, error: null }),
    in: (_col: string, vals: any[]) =>
      Promise.resolve({ data: rows.filter((r) => vals.includes(r.assignment_id ?? r.id ?? r.skill_code)), error: null }),
  };
  return builder;
};

const makeSupabaseStub = (data: Record<string, Row[]>) => ({
  from: (table: string) => makeBuilder(data[table] ?? []),
});

async function main() {
  const supabase = makeSupabaseStub({
    skills: [
      { profile_id: 'user-1', skill_code: 'react', level: 2 },
      { profile_id: 'user-1', skill_code: 'typescript', level: 3 },
    ],
    match_interest: [{ actor_profile_id: 'user-1', assignment_id: 'a1', created_at: '2024-01-01' }],
    matches: [{ profile_id: 'user-1', assignment_id: 'a2', score: 0.9 }],
    assignments: [
      { id: 'a1', role: 'Frontend Dev', status: 'active', updated_at: '2024-12-01' },
      { id: 'a2', role: 'Fullstack Dev', status: 'active', updated_at: '2024-11-01' },
    ],
    assignment_expertise_matrix: [
      { assignment_id: 'a1', skill_code: 'react', min_level: 4, weight: 2 },
      { assignment_id: 'a1', skill_code: 'graphql', min_level: 3, weight: 1 },
      { assignment_id: 'a2', skill_code: 'typescript', min_level: 4, weight: 1 },
    ],
    skills_taxonomy: [
      { code: 'react', name_i18n: { en: 'React' } },
      { code: 'graphql', name_i18n: { en: 'GraphQL' } },
      { code: 'typescript', name_i18n: { en: 'TypeScript' } },
    ],
  });

  const result = await computeSkillGaps({
    profileId: 'user-1',
    supabase: supabase as any,
    timeframeDays: 400,
  });

  console.log('gap-service smoke ok', result.gaps.length);
}

main().catch((err) => {
  console.error('gap-service smoke failed', err);
  process.exit(1);
});

