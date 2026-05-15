export function normalizeAvailableSkills(skills: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const skill of skills) {
    const trimmed = skill.trim();
    if (!trimmed) continue;

    const key = trimmed.toLocaleLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    normalized.push(trimmed);
  }

  return normalized.sort((a, b) => a.localeCompare(b));
}

export function mapLegacySkillsToAvailable(rawSkills: string, availableSkills: string[]): string[] {
  return mapSkillListToAvailable(rawSkills, availableSkills);
}

export function mapSkillListToAvailable(
  rawSkills: string | string[] | null | undefined,
  availableSkills: string[]
): string[] {
  const normalizedAvailable = normalizeAvailableSkills(availableSkills);
  const availableByLower = new Map(
    normalizedAvailable.map((skill) => [skill.toLocaleLowerCase(), skill])
  );

  const selected: string[] = [];
  const seen = new Set<string>();
  const tokens = (Array.isArray(rawSkills) ? rawSkills : (rawSkills?.split(/[\n,]/) ?? []))
    .map((token) => token.trim())
    .filter(Boolean);

  for (const token of tokens) {
    const resolved = availableByLower.get(token.toLocaleLowerCase());
    if (!resolved) continue;

    const key = resolved.toLocaleLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    selected.push(resolved);
  }

  return selected;
}

export function serializeSelectedSkills(skills: string[]): string {
  return skills.join(', ');
}
