const ABBREVIATIONS: Record<string, string> = {
  ai: 'artificial intelligence',
  api: 'application programming interface',
  cx: 'customer experience',
  fe: 'frontend',
  js: 'javascript',
  ops: 'operations',
  pm: 'product management',
  qa: 'quality assurance',
  ui: 'user interface',
  ux: 'user experience',
};

const COMPOUND_VARIANTS: Record<string, string> = {
  'front end': 'frontend',
  'front-end': 'frontend',
  'back end': 'backend',
  'back-end': 'backend',
  'full stack': 'fullstack',
  'full-stack': 'fullstack',
  'java script': 'javascript',
  'type script': 'typescript',
};

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'has',
  'in',
  'into',
  'is',
  'it',
  'of',
  'on',
  'or',
  'our',
  'that',
  'the',
  'their',
  'this',
  'to',
  'with',
]);

function normalizeInput(input: string | null | undefined): string {
  return (input ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[’']/g, '')
    .replace(/[_/\\-]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCompoundPhrases(input: string): string {
  let output = input;
  for (const [variant, canonical] of Object.entries(COMPOUND_VARIANTS)) {
    output = output.replace(new RegExp(`\\b${variant}\\b`, 'g'), canonical);
  }
  return output;
}

function stemToken(token: string): string {
  if (token.length <= 3) return token;

  if (token.endsWith('ies') && token.length > 4) {
    return `${token.slice(0, -3)}y`;
  }

  if (token.endsWith('ing') && token.length > 5) {
    const base = token.slice(0, -3);
    if (base.endsWith('c')) return `${base}k`;
    return base.endsWith('duc') ? `${base}e` : base;
  }

  if (token.endsWith('ed') && token.length > 4) {
    const base = token.slice(0, -2);
    return base.endsWith('duc') ? `${base}e` : base;
  }

  if (token.endsWith('es') && token.length > 4) {
    return token.slice(0, -2);
  }

  if (token.endsWith('s') && token.length > 3) {
    return token.slice(0, -1);
  }

  return token;
}

function expandAbbreviations(tokens: string[]): string[] {
  const expanded: string[] = [];
  for (const token of tokens) {
    const expansion = ABBREVIATIONS[token];
    if (expansion) {
      expanded.push(...expansion.split(/\s+/g));
    } else {
      expanded.push(token);
    }
  }
  return expanded;
}

export function normalizeMatchText(input: string | null | undefined): string {
  const normalized = normalizeCompoundPhrases(normalizeInput(input));
  if (!normalized) return '';

  return expandAbbreviations(normalized.split(/\s+/g)).map(stemToken).filter(Boolean).join(' ');
}

export function tokenizeMatchText(input: string | null | undefined): string[] {
  const normalized = normalizeMatchText(input);
  if (!normalized) return [];

  return normalized
    .split(/\s+/g)
    .map(stemToken)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

export function normalizePhrase(input: string | null | undefined): string {
  return tokenizeMatchText(input).join(' ');
}

export function phraseVariants(input: string | null | undefined): string[] {
  const raw = normalizeInput(input);
  const normalized = normalizePhrase(raw);
  if (!normalized) return [];

  const compact = normalized.replace(/\s+/g, '');
  const variants = new Set<string>([normalized, compact]);
  const rawCompact = normalizeCompoundPhrases(raw).replace(/\s+/g, '');
  if (rawCompact) variants.add(rawCompact);

  const tokens = raw.split(/\s+/g).filter(Boolean);
  for (const token of tokens) {
    const expansion = ABBREVIATIONS[token];
    if (expansion) {
      variants.add(normalizePhrase(expansion));
      variants.add(normalizePhrase(expansion).replace(/\s+/g, ''));
    }
  }

  return [...variants].filter(Boolean).sort();
}

export function tokenOverlap(left: string | null | undefined, right: string | null | undefined) {
  const leftTokens = new Set(tokenizeMatchText(left));
  const rightTokens = new Set(tokenizeMatchText(right));
  const overlap = [...leftTokens].filter((token) => rightTokens.has(token));
  return {
    overlap,
    count: overlap.length,
    leftSize: leftTokens.size,
    rightSize: rightTokens.size,
  };
}

export function hasMeaningfulTokenOverlap(
  left: string | null | undefined,
  right: string | null | undefined,
  minimum = 2
) {
  const overlap = tokenOverlap(left, right);
  return overlap.count >= minimum;
}
