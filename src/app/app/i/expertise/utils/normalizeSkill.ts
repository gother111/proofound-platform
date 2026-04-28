import type { L4Skill } from '../components/AddSkillDrawer';
import { skillDisplayLabel } from '@/lib/copy/labels';

/**
 * Normalize a newly created or fetched skill so the client can render it immediately.
 * Ensures taxonomy, display name, and default counts are present.
 */
export function normalizeSkillForClient(skill: any, fallback?: L4Skill) {
  if (!skill) return null;

  const base = { ...skill };

  // Ensure taxonomy exists; fall back to search result context if missing
  if (!base.taxonomy && fallback) {
    base.taxonomy = {
      code: fallback.code,
      slug: fallback.slug || fallback.code,
      name_i18n: fallback.nameI18n,
      cat_id: fallback.l1?.catId ?? fallback.catId ?? fallback.l1?.catId,
      subcat_id: fallback.l2?.subcatId ?? fallback.subcatId ?? fallback.l2?.subcatId,
      l3_id: fallback.l3?.l3Id ?? (fallback as any).l3Id ?? fallback.l3?.l3Id,
      tags: [],
    };
  }

  base.skillCode = base.skillCode || base.skill_code || base.skill_id || fallback?.code || '';
  base.skill_name = skillDisplayLabel(
    {
      skillName: base.skill_name,
      customSkillName: base.custom_skill_name,
      taxonomyName: base.taxonomy?.name_i18n?.en || fallback?.nameI18n?.en,
      id: base.skill_id || base.id,
      code: base.skillCode,
    },
    'New skill'
  );

  // Default counts so dashboards don’t filter it out
  base.proof_count = base.proof_count ?? 0;
  base.verification_count = base.verification_count ?? 0;
  base.verification_sources = base.verification_sources ?? [];
  base.monthsExperience = base.monthsExperience ?? base.months_experience ?? 0;
  base.lastUsedAt = base.lastUsedAt ?? base.last_used_at ?? null;

  return base;
}

export type { L4Skill };
