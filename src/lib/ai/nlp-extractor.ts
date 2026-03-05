/**
 * NLP-based Skill Extraction using Compromise
 *
 * Extracts potential skill phrases from CV/JD text using natural language processing
 * patterns without requiring external API calls.
 */

import nlp from 'compromise';

// Extend compromise with custom patterns for skill detection
const skillPatterns = {
  // Technical terms often follow these patterns
  techPatterns: [
    '#Noun+ #Noun', // e.g., "machine learning", "data science"
    '#Adjective #Noun+', // e.g., "agile development", "cloud computing"
  ],
};

export interface NLPExtractedPhrase {
  text: string;
  type: 'skill' | 'experience' | 'role' | 'industry' | 'education';
  confidence: number;
  context: string;
  yearsExperience?: number;
  monthsExperience?: number;
}

export interface NLPExtractionResult {
  phrases: NLPExtractedPhrase[];
  roles: string[];
  industries: string[];
  totalYearsExperience?: number;
  educationLevel?: string;
}

/**
 * Common technical skills and their variations for pattern matching
 * This helps boost confidence when we find exact matches
 */
const KNOWN_SKILL_PATTERNS: Record<string, string[]> = {
  // Programming Languages
  javascript: ['javascript', 'js', 'ecmascript', 'es6', 'es2015'],
  typescript: ['typescript', 'ts'],
  python: ['python', 'py', 'python3'],
  java: ['java', 'jvm'],
  'c#': ['c#', 'csharp', 'c-sharp', '.net', 'dotnet'],
  'c++': ['c++', 'cpp', 'c plus plus'],
  go: ['go', 'golang', 'go lang', 'go language'],
  rust: ['rust', 'rustlang'],
  ruby: ['ruby', 'ruby on rails', 'ror'],
  php: ['php'],
  swift: ['swift', 'swiftui'],
  kotlin: ['kotlin'],
  scala: ['scala'],
  r: ['r programming', 'r language', 'rstudio'],

  // Frontend
  react: ['react', 'reactjs', 'react.js'],
  'react native': ['react native', 'react-native', 'rn'],
  vue: ['vue', 'vuejs', 'vue.js', 'vue 3'],
  angular: ['angular', 'angularjs', 'angular 2+'],
  svelte: ['svelte', 'sveltekit'],
  nextjs: ['next.js', 'nextjs', 'next'],
  nuxt: ['nuxt', 'nuxtjs', 'nuxt.js'],

  // Backend
  nodejs: ['node', 'nodejs', 'node.js'],
  express: ['express', 'expressjs', 'express.js'],
  django: ['django'],
  flask: ['flask'],
  spring: ['spring', 'spring boot', 'springboot'],
  laravel: ['laravel'],
  rails: ['rails', 'ruby on rails'],
  fastapi: ['fastapi', 'fast api'],

  // Databases
  sql: ['sql', 'structured query language'],
  mysql: ['mysql', 'mariadb'],
  postgresql: ['postgresql', 'postgres', 'psql'],
  mongodb: ['mongodb', 'mongo'],
  redis: ['redis'],
  elasticsearch: ['elasticsearch', 'elastic search', 'elk'],
  dynamodb: ['dynamodb', 'dynamo db'],
  cassandra: ['cassandra'],

  // Cloud & DevOps
  aws: ['aws', 'amazon web services', 'ec2', 's3', 'lambda'],
  azure: ['azure', 'microsoft azure'],
  gcp: ['gcp', 'google cloud', 'google cloud platform'],
  docker: ['docker', 'containerization', 'containers'],
  kubernetes: ['kubernetes', 'k8s', 'kube'],
  terraform: ['terraform', 'iac', 'infrastructure as code'],
  ansible: ['ansible'],
  jenkins: ['jenkins', 'jenkins ci'],
  'github actions': ['github actions', 'gh actions'],
  'gitlab ci': ['gitlab ci', 'gitlab-ci'],
  'ci/cd': ['ci/cd', 'cicd', 'continuous integration', 'continuous deployment'],

  // Data & ML
  'machine learning': ['machine learning', 'ml', 'deep learning', 'dl'],
  tensorflow: ['tensorflow', 'tf'],
  pytorch: ['pytorch', 'torch'],
  'data science': ['data science', 'data scientist'],
  'data analysis': ['data analysis', 'data analyst', 'data analytics'],
  pandas: ['pandas'],
  numpy: ['numpy'],
  scikit: ['scikit-learn', 'sklearn', 'scikit'],
  spark: ['spark', 'apache spark', 'pyspark'],
  'jupyter notebook': ['jupyter notebook', 'jupyter', 'ipynb', 'google colab', 'colab'],

  // Design & UX
  figma: ['figma'],
  sketch: ['sketch'],
  'adobe xd': ['adobe xd', 'xd'],
  photoshop: ['photoshop', 'adobe photoshop'],
  illustrator: ['illustrator', 'adobe illustrator'],
  'ui design': ['ui design', 'ui/ux', 'user interface'],
  'ux design': ['ux design', 'user experience', 'ux research'],

  // Project Management
  agile: ['agile', 'agile methodology', 'agile development'],
  scrum: ['scrum', 'scrum master'],
  kanban: ['kanban'],
  jira: ['jira', 'atlassian jira'],
  'project management': ['project management', 'pm', 'project manager'],

  // Soft Skills
  leadership: ['leadership', 'team lead', 'team leader', 'leading teams'],
  communication: ['communication', 'communication skills', 'verbal communication'],
  'problem solving': ['problem solving', 'problem-solving', 'analytical'],
  teamwork: ['teamwork', 'team player', 'collaboration', 'collaborative'],
};

const SKILLS_SECTION_HEADING_PATTERN =
  /^(skills?|core\s+skills?|technical\s+skills?|technologies?|tech\s+stack|tooling|tools?|competenc(?:y|ies)|languages?|certifications?|frameworks?)\s*:?\s*$/i;

const SECTION_BOUNDARY_PATTERN =
  /^(experience|work\s+experience|professional\s+experience|employment|education|projects?|summary|profile|about|volunteer(?:ing)?|awards?|publications?|references?)\s*:?\s*$/i;

const INLINE_SKILL_LINE_PATTERN =
  /^(skills?|technologies?|tools?|competenc(?:y|ies)|tech\s+stack)\s*:\s*(.+)$/i;

const NOISY_SKILL_PHRASE_PATTERN =
  /\b(responsible\s+for|worked\s+on|worked\s+with|based\s+in|located\s+in|at\s+[A-Z][a-z]+|team|department|stakeholders?)\b/i;
const NARRATIVE_ONLY_CONTEXT_PATTERN =
  /\b(responsible\s+for|worked\s+on|worked\s+with|led|managed|supported|delivered|collaborated|stakeholders?|customers?|clients?)\b/i;

/**
 * Patterns to identify experience duration
 */
const EXPERIENCE_PATTERNS = [
  /(\d+)\+?\s*years?\s+(?:of\s+)?(?:experience\s+)?(?:in\s+|with\s+)?(.+?)(?:\.|,|$)/gi,
  /(\d+)\+?\s*years?\s+(.+?)(?:\s+experience)?(?:\.|,|$)/gi,
  /(?:experience|experienced)\s+(?:in\s+|with\s+)?(.+?)\s+(?:for\s+)?(\d+)\+?\s*years?/gi,
  /(\d+)\s*-\s*(\d+)\s*years?\s+(?:of\s+)?(?:experience\s+)?(?:in\s+|with\s+)?(.+?)(?:\.|,|$)/gi,
  /(\d+)\+?\s*months?\s+(?:of\s+)?(?:experience\s+)?(?:in\s+|with\s+)?(.+?)(?:\.|,|$)/gi,
];

/**
 * Proficiency indicator patterns
 */
const PROFICIENCY_PATTERNS = [
  { pattern: /expert\s+(?:in\s+|with\s+)?(.+?)(?:\.|,|$)/gi, level: 5 },
  { pattern: /mastery\s+(?:of\s+|in\s+)?(.+?)(?:\.|,|$)/gi, level: 5 },
  { pattern: /advanced\s+(?:knowledge\s+of\s+|in\s+)?(.+?)(?:\.|,|$)/gi, level: 4 },
  { pattern: /proficient\s+(?:in\s+|with\s+)?(.+?)(?:\.|,|$)/gi, level: 4 },
  { pattern: /strong\s+(?:knowledge\s+of\s+|in\s+)?(.+?)(?:\.|,|$)/gi, level: 4 },
  { pattern: /intermediate\s+(?:knowledge\s+of\s+|in\s+)?(.+?)(?:\.|,|$)/gi, level: 3 },
  { pattern: /working\s+knowledge\s+(?:of\s+)?(.+?)(?:\.|,|$)/gi, level: 3 },
  { pattern: /familiar\s+with\s+(.+?)(?:\.|,|$)/gi, level: 2 },
  { pattern: /basic\s+(?:knowledge\s+of\s+|in\s+)?(.+?)(?:\.|,|$)/gi, level: 2 },
  { pattern: /learning\s+(.+?)(?:\.|,|$)/gi, level: 1 },
  { pattern: /beginner\s+(?:in\s+|with\s+)?(.+?)(?:\.|,|$)/gi, level: 1 },
];

/**
 * Role/title patterns
 */
const ROLE_PATTERNS = [
  /(?:^|\n)\s*([A-Z][a-zA-Z\s]+(?:Engineer|Developer|Designer|Manager|Analyst|Architect|Lead|Director|Specialist|Consultant|Administrator))\s*(?:\n|$|-|@|at)/gm,
  /(?:worked\s+as\s+(?:a\s+)?|position:\s*|role:\s*|title:\s*)([A-Za-z\s]+(?:Engineer|Developer|Designer|Manager|Analyst))/gi,
];

/**
 * Industry patterns
 */
const INDUSTRY_KEYWORDS = [
  'fintech',
  'healthcare',
  'e-commerce',
  'ecommerce',
  'banking',
  'finance',
  'insurance',
  'retail',
  'manufacturing',
  'logistics',
  'education',
  'edtech',
  'gaming',
  'media',
  'entertainment',
  'telecommunications',
  'automotive',
  'aerospace',
  'energy',
  'real estate',
  'saas',
  'b2b',
  'b2c',
  'startup',
  'enterprise',
  'government',
  'non-profit',
];

type SectionSlice = {
  heading: string;
  contentLines: string[];
};

function normalizeSkillAlias(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+.#/\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildKnownSkillLookup(): Map<string, string> {
  const byAlias = new Map<string, string>();
  for (const [canonical, variations] of Object.entries(KNOWN_SKILL_PATTERNS)) {
    const values = [canonical, ...variations];
    for (const value of values) {
      const normalized = normalizeSkillAlias(value);
      if (!normalized || byAlias.has(normalized)) {
        continue;
      }
      byAlias.set(normalized, canonical);
    }
  }
  return byAlias;
}

const KNOWN_SKILL_BY_ALIAS = buildKnownSkillLookup();

function buildSkillRegex(variation: string): RegExp {
  const escaped = escapeRegex(variation.trim());
  return new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'gi');
}

function splitSkillTokens(raw: string): string[] {
  return raw
    .split(/\s*(?:,|;|\||•|·|▪|\band\b|\bor\b)\s*/gi)
    .map((part) => part.trim())
    .filter(Boolean);
}

function toSectionSlices(text: string): SectionSlice[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const slices: SectionSlice[] = [];
  let current: SectionSlice | null = null;

  for (const line of lines) {
    if (SKILLS_SECTION_HEADING_PATTERN.test(line)) {
      if (current && current.contentLines.length > 0) {
        slices.push(current);
      }
      current = {
        heading: line,
        contentLines: [],
      };
      continue;
    }

    if (SECTION_BOUNDARY_PATTERN.test(line)) {
      if (current && current.contentLines.length > 0) {
        slices.push(current);
      }
      current = null;
      continue;
    }

    const inlineMatch = line.match(INLINE_SKILL_LINE_PATTERN);
    if (inlineMatch) {
      slices.push({
        heading: inlineMatch[1],
        contentLines: [inlineMatch[2]],
      });
      continue;
    }

    if (!current) {
      continue;
    }

    current.contentLines.push(line);
  }

  if (current && current.contentLines.length > 0) {
    slices.push(current);
  }

  return slices;
}

function looksLikeNoiseCandidate(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) {
    return true;
  }

  if (normalized.length < 2 || normalized.length > 60) {
    return true;
  }

  if (NOISY_SKILL_PHRASE_PATTERN.test(normalized)) {
    return true;
  }

  if (/^\d+$/.test(normalized)) {
    return true;
  }

  const normalizedAlias = normalizeSkillAlias(normalized);
  if (isCommonWord(normalizedAlias)) {
    return true;
  }

  return false;
}

function extractSectionSkillCandidates(text: string): Array<{
  raw: string;
  canonical: string | null;
  confidence: number;
  context: string;
}> {
  const slices = toSectionSlices(text);
  const results: Array<{
    raw: string;
    canonical: string | null;
    confidence: number;
    context: string;
  }> = [];

  for (const slice of slices) {
    for (const line of slice.contentLines.slice(0, 30)) {
      const tokens = splitSkillTokens(line);
      for (const token of tokens) {
        if (looksLikeNoiseCandidate(token)) {
          continue;
        }

        const normalized = normalizeSkillAlias(token);
        const canonical = KNOWN_SKILL_BY_ALIAS.get(normalized) || null;
        const confidence = canonical ? 0.93 : 0.72;

        results.push({
          raw: token,
          canonical,
          confidence,
          context: findContext(text, token),
        });
      }
    }
  }

  return results;
}

/**
 * Extract skill phrases from text using NLP patterns
 */
export function extractSkillPhrases(text: string): NLPExtractionResult {
  const phrases: NLPExtractedPhrase[] = [];
  const foundSkills = new Set<string>();
  const roles: string[] = [];
  const industries: string[] = [];
  let totalYearsExperience: number | undefined;

  // Normalize text
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  const lowerText = normalizedText.toLowerCase();

  // 1. Extract skills from explicit skills/tooling sections (highest precision)
  const sectionSkills = extractSectionSkillCandidates(text);
  for (const sectionSkill of sectionSkills) {
    const key = normalizeSkillAlias(sectionSkill.canonical || sectionSkill.raw);
    if (!key || foundSkills.has(key)) {
      continue;
    }
    foundSkills.add(key);
    phrases.push({
      text: sectionSkill.canonical || sectionSkill.raw,
      type: 'skill',
      confidence: sectionSkill.confidence,
      context: sectionSkill.context,
    });
  }

  // 2. Extract known skill patterns with high confidence
  for (const [skillName, variations] of Object.entries(KNOWN_SKILL_PATTERNS)) {
    for (const variation of variations) {
      const regex = buildSkillRegex(variation);
      const match = regex.exec(lowerText);
      const canonicalKey = normalizeSkillAlias(skillName);
      if (match && !foundSkills.has(canonicalKey)) {
        foundSkills.add(canonicalKey);

        // Extract context around the match
        const contextStart = Math.max(0, match.index - 50);
        const contextEnd = Math.min(normalizedText.length, match.index + variation.length + 50);
        const context = normalizedText.slice(contextStart, contextEnd);

        phrases.push({
          text: skillName,
          type: 'skill',
          confidence: 0.9, // High confidence for known patterns
          context: '...' + context + '...',
        });
        break;
      }
    }
  }

  // 3. Extract experience patterns
  for (const pattern of EXPERIENCE_PATTERNS) {
    let match;
    const patternCopy = new RegExp(pattern.source, pattern.flags);
    while ((match = patternCopy.exec(normalizedText)) !== null) {
      const years = parseInt(match[1]);
      const skill = match[2]?.trim();

      if (skill && skill.length > 2 && skill.length < 50) {
        // Update total experience if this is higher
        if (!totalYearsExperience || years > totalYearsExperience) {
          totalYearsExperience = years;
        }

        const skillLower = normalizeSkillAlias(skill);
        if (!foundSkills.has(skillLower)) {
          foundSkills.add(skillLower);
          phrases.push({
            text: skill,
            type: 'experience',
            confidence: 0.85,
            context: match[0],
            yearsExperience: years,
            monthsExperience: years * 12,
          });
        }
      }
    }
  }

  // 4. Extract proficiency-indicated skills
  for (const { pattern, level } of PROFICIENCY_PATTERNS) {
    let match;
    const patternCopy = new RegExp(pattern.source, pattern.flags);
    while ((match = patternCopy.exec(normalizedText)) !== null) {
      const skill = match[1]?.trim();
      if (skill && skill.length > 2 && skill.length < 50) {
        const skillLower = normalizeSkillAlias(skill);
        if (!foundSkills.has(skillLower)) {
          foundSkills.add(skillLower);
          phrases.push({
            text: skill,
            type: 'skill',
            confidence: 0.75 + level * 0.04, // Higher proficiency = slightly higher confidence
            context: match[0],
          });
        }
      }
    }
  }

  // 5. Use compromise NLP for additional extraction (precision constrained)
  const doc = nlp(normalizedText);

  // Extract noun phrases that might be skills
  const nounPhrases = doc.nouns().out('array') as string[];
  for (const phrase of nounPhrases) {
    const cleanPhrase = phrase.toLowerCase().trim();
    if (
      cleanPhrase.length > 3 &&
      cleanPhrase.length < 40 &&
      !foundSkills.has(cleanPhrase) &&
      !isCommonWord(cleanPhrase)
    ) {
      // Check if it looks like a technical term
      const context = findContext(normalizedText, phrase);
      if (
        isTechnicalTerm(cleanPhrase) &&
        !looksLikeNoiseCandidate(cleanPhrase) &&
        hasStrongNounSkillSignal(cleanPhrase, context)
      ) {
        foundSkills.add(cleanPhrase);
        phrases.push({
          text: phrase,
          type: 'skill',
          confidence: 0.42, // Lower confidence for broad NLP extraction
          context,
        });
      }
    }
  }

  // 6. Extract roles/titles
  for (const pattern of ROLE_PATTERNS) {
    let match;
    const patternCopy = new RegExp(pattern.source, pattern.flags);
    while ((match = patternCopy.exec(normalizedText)) !== null) {
      const role = match[1]?.trim();
      if (role && role.length > 3 && !roles.includes(role)) {
        roles.push(role);
      }
    }
  }

  // 7. Extract industries
  for (const industry of INDUSTRY_KEYWORDS) {
    if (lowerText.includes(industry) && !industries.includes(industry)) {
      industries.push(industry);
    }
  }

  return {
    phrases,
    roles,
    industries,
    totalYearsExperience,
  };
}

/**
 * Check if a word is a common English word that shouldn't be a skill
 */
function isCommonWord(word: string): boolean {
  const commonWords = new Set([
    'the',
    'and',
    'for',
    'are',
    'but',
    'not',
    'you',
    'all',
    'can',
    'had',
    'her',
    'was',
    'one',
    'our',
    'out',
    'has',
    'his',
    'how',
    'its',
    'may',
    'new',
    'now',
    'old',
    'see',
    'way',
    'who',
    'did',
    'get',
    'let',
    'put',
    'say',
    'she',
    'too',
    'use',
    'work',
    'worked',
    'working',
    'time',
    'year',
    'years',
    'month',
    'months',
    'day',
    'days',
    'team',
    'teams',
    'company',
    'companies',
    'experience',
    'experienced',
    'responsible',
    'responsibilities',
    'ability',
    'abilities',
    'skills',
    'skill',
    'knowledge',
    'understanding',
    'excellent',
    'good',
    'strong',
    'great',
    'best',
    'high',
    'level',
    'various',
    'multiple',
    'different',
    'several',
    'many',
    'other',
    'others',
    'well',
    'also',
    'like',
    'just',
    'only',
    'more',
    'most',
    'some',
    'such',
    'than',
    'then',
    'when',
    'where',
    'which',
    'while',
    'will',
    'with',
    'would',
    'about',
    'after',
    'before',
    'being',
    'between',
    'both',
    'each',
    'from',
    'have',
    'having',
    'into',
    'make',
    'made',
    'over',
    'same',
    'them',
    'these',
    'they',
    'this',
    'those',
    'through',
    'under',
    'very',
    'what',
    'your',
  ]);

  return commonWords.has(word.toLowerCase());
}

/**
 * Check if a phrase looks like a technical term
 */
function isTechnicalTerm(phrase: string): boolean {
  // Technical indicators
  const technicalIndicators = [
    /\d/, // Contains numbers
    /[A-Z]{2,}/, // Contains acronyms
    /\+\+/, // C++, etc.
    /#/, // C#, etc.
    /\.js$/, // JavaScript frameworks
    /^[a-z]+(?:ing|tion|ment|sis|ity)$/, // Technical suffixes (but more specific)
    /^(?:api|sdk|orm|cms|crm|erp|bi|ai|ml|dl|nlp|cv|ui|ux|qa|ci|cd)$/i, // Common tech acronyms
  ];

  // Check for technical patterns
  for (const pattern of technicalIndicators) {
    if (pattern.test(phrase)) {
      return true;
    }
  }

  // Check for camelCase or snake_case
  if (/[a-z][A-Z]/.test(phrase) || /_/.test(phrase)) {
    return true;
  }

  // Check if it contains technical keywords
  const technicalKeywords = [
    'software',
    'programming',
    'development',
    'framework',
    'library',
    'database',
    'server',
    'client',
    'frontend',
    'backend',
    'fullstack',
    'devops',
    'cloud',
    'system',
    'network',
    'security',
    'testing',
    'automation',
    'integration',
    'deployment',
    'architecture',
    'design',
    'analysis',
    'management',
    'engineering',
  ];

  const lowerPhrase = phrase.toLowerCase();
  for (const keyword of technicalKeywords) {
    if (lowerPhrase.includes(keyword)) {
      return true;
    }
  }

  return false;
}

function hasStrongNounSkillSignal(phrase: string, context: string): boolean {
  const normalized = normalizeSkillAlias(phrase);
  if (!normalized) {
    return false;
  }

  if (KNOWN_SKILL_BY_ALIAS.has(normalized)) {
    return true;
  }

  if (normalized.split(' ').length > 3) {
    return false;
  }

  if (/\b(engineer|developer|manager|team|project|experience|employment)\b/i.test(phrase)) {
    return false;
  }

  const normalizedContext = context.toLowerCase();
  const inExplicitSkillContext =
    /\b(skills?|competenc(?:y|ies)|technologies?|tooling|tools?|frameworks?|tech\s+stack)\b/.test(
      normalizedContext
    );

  if (NARRATIVE_ONLY_CONTEXT_PATTERN.test(normalizedContext) && !inExplicitSkillContext) {
    return false;
  }

  if (
    /^[a-z]+$/.test(normalized) &&
    normalized.length < 4 &&
    !KNOWN_SKILL_BY_ALIAS.has(normalized)
  ) {
    return false;
  }

  if (/[+#./\d]/.test(phrase) || /[a-z][A-Z]/.test(phrase)) {
    return true;
  }

  if (!inExplicitSkillContext) {
    return false;
  }

  if (normalized.split(' ').length > 2 && !KNOWN_SKILL_BY_ALIAS.has(normalized)) {
    return false;
  }

  return true;
}

/**
 * Find context around a phrase in text
 */
function findContext(text: string, phrase: string): string {
  const index = text.toLowerCase().indexOf(phrase.toLowerCase());
  if (index === -1) return phrase;

  const start = Math.max(0, index - 30);
  const end = Math.min(text.length, index + phrase.length + 30);
  return '...' + text.slice(start, end) + '...';
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get skill variations for a given skill name
 */
export function getSkillVariations(skillName: string): string[] {
  const lowerName = skillName.toLowerCase();

  // Check if it's a known skill
  for (const [canonical, variations] of Object.entries(KNOWN_SKILL_PATTERNS)) {
    if (canonical === lowerName || variations.some((v) => v.toLowerCase() === lowerName)) {
      return [canonical, ...variations];
    }
  }

  // Generate basic variations
  return [
    skillName,
    skillName.toLowerCase(),
    skillName.toUpperCase(),
    skillName.replace(/\s+/g, '-'),
    skillName.replace(/\s+/g, '_'),
    skillName.replace(/-/g, ' '),
    skillName.replace(/_/g, ' '),
  ];
}
