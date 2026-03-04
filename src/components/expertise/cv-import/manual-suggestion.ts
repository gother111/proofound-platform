type SkillMatchMethod = 'exact' | 'synonym' | 'fuzzy' | 'semantic';

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+.#/\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function lexicalOverlap(left: string, right: string): number {
  const leftTokens = new Set(normalize(left).split(' ').filter(Boolean));
  const rightTokens = new Set(normalize(right).split(' ').filter(Boolean));
  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      overlap += 1;
    }
  }

  return overlap / Math.max(leftTokens.size, rightTokens.size);
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

export function buildManualSuggestion(params: {
  query: string;
  skillId: string;
  skillName: string;
}): {
  skill_id: string;
  skill_name: string;
  match_method: SkillMatchMethod;
  score: number;
} {
  const normalizedQuery = normalize(params.query);
  const normalizedName = normalize(params.skillName);
  const overlap = lexicalOverlap(normalizedQuery, normalizedName);

  let matchMethod: SkillMatchMethod = 'semantic';
  let score = 0.6;

  if (normalizedQuery && normalizedQuery === normalizedName) {
    matchMethod = 'exact';
    score = 0.98;
  } else if (normalizedQuery && normalizedName.includes(normalizedQuery)) {
    matchMethod = 'synonym';
    score = 0.92;
  } else if (overlap >= 0.45) {
    matchMethod = 'fuzzy';
    score = 0.72 + overlap * 0.2;
  } else {
    matchMethod = 'semantic';
    score = 0.58 + overlap * 0.16;
  }

  return {
    skill_id: params.skillId,
    skill_name: params.skillName,
    match_method: matchMethod,
    score: clamp(score),
  };
}
