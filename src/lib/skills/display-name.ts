export type SkillDisplayNameInput = {
  nameI18n?: Record<string, string> | null;
  skillId?: string | null;
  skillCode?: string | null;
};

function toTitleCase(input: string): string {
  return input
    .split(' ')
    .filter(Boolean)
    .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Derive a stable, human-friendly skill display name.
 *
 * Notes:
 * - Taxonomy-backed skills should prefer `nameI18n.en`.
 * - Custom skills are stored as `skill_id` with the format:
 *   `custom-<cat>-<subcat>-<l3>-<slug>`, where <slug> is kebab-case.
 */
export function getSkillDisplayName(input: SkillDisplayNameInput): string {
  const taxonomyName = input.nameI18n?.en?.trim();
  if (taxonomyName) return taxonomyName;

  const skillId = input.skillId?.trim();
  if (skillId) {
    const match = /^custom-(\d+)-(\d+)-(\d+)-(.+)$/.exec(skillId);
    if (match) {
      const slug = (match[4] || '').trim();
      const human = slug.replace(/-+/g, ' ').trim();
      if (human) return toTitleCase(human);
      return 'Custom Skill';
    }

    return skillId;
  }

  const skillCode = input.skillCode?.trim();
  if (skillCode) return skillCode;

  return 'Unknown Skill';
}
