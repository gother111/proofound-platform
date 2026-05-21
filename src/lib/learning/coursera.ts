import { LearningProvider, LearningRecommendations, LearningResource } from './types';
import { log } from '@/lib/log';

const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

type CachedEntry = { expires: number; data: LearningResource[] };
const cache = new Map<string, CachedEntry>();

const FALLBACK_RESOURCES: LearningResource[] = [
  {
    id: 'coursera-react',
    title: 'Meta React Professional Certificate',
    url: 'https://www.coursera.org/professional-certificates/meta-react',
    provider: 'coursera',
    skillMatch: 'react',
    duration: '5 months (7 hrs/week)',
    level: 'Intermediate',
    rating: 4.8,
    badges: ['Certificate', 'Hands-on projects'],
  },
  {
    id: 'coursera-ts',
    title: 'TypeScript for React Developers',
    url: 'https://www.coursera.org/learn/typescript',
    provider: 'coursera',
    skillMatch: 'typescript',
    duration: '4 weeks',
    level: 'Intermediate',
    rating: 4.7,
  },
  {
    id: 'coursera-pm',
    title: 'Google Project Management',
    url: 'https://www.coursera.org/professional-certificates/google-project-management',
    provider: 'coursera',
    skillMatch: 'project-management',
    duration: '6 months (10 hrs/week)',
    level: 'Beginner',
    rating: 4.8,
    badges: ['Certificate', 'Career credential'],
  },
];

const normalize = (skill: string) => skill.trim().toLowerCase();

const parseCourseraResponse = async (skill: string, res: Response): Promise<LearningResource[]> => {
  const body = await res.json();
  const elements = Array.isArray(body.elements) ? body.elements : [];

  return elements.slice(0, 5).map((item: any) => ({
    id: String(item.id ?? `${skill}-${item.slug ?? item.name ?? 'course'}`),
    title: item.name ?? 'Course',
    url: item.slug ? `https://www.coursera.org/learn/${item.slug}` : 'https://www.coursera.org',
    provider: 'coursera',
    skillMatch: skill,
    level: item.difficulty ?? undefined,
    rating: typeof item.rating === 'number' ? item.rating : undefined,
    badges: item.badges ?? [],
  }));
};

const fetchCoursesForSkill = async (skill: string): Promise<LearningResource[]> => {
  const key = normalize(skill);
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.data;

  const apiBase = process.env.COURSERA_API_BASE ?? 'https://api.coursera.org/api/courses.v1';
  const apiKey = process.env.COURSERA_API_KEY;
  const url = `${apiBase}?q=search&query=${encodeURIComponent(skill)}&fields=name,slug,difficulty,rating,badges&limit=5`;

  try {
    const res = await fetch(url, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`Coursera API returned ${res.status}`);

    const parsed = await parseCourseraResponse(skill, res);
    const withSkill = parsed.map((item) => ({ ...item, skillMatch: key }));

    cache.set(key, { expires: Date.now() + CACHE_TTL_MS, data: withSkill });
    return withSkill;
  } catch (error) {
    log.warn('learning.coursera.fallback_used', {
      skill: key,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    const fallback = FALLBACK_RESOURCES.filter(
      (item) => item.skillMatch === key || item.skillMatch === skill
    );
    cache.set(key, { expires: Date.now() + CACHE_TTL_MS, data: fallback });
    return fallback;
  }
};

export const courseraProvider: LearningProvider = {
  async getCoursesForSkills(skills: string[]): Promise<LearningRecommendations> {
    const uniqueSkills = Array.from(new Set(skills.map(normalize)));
    const entries = await Promise.all(
      uniqueSkills.map(async (skill) => [skill, await fetchCoursesForSkill(skill)] as const)
    );

    return Object.fromEntries(entries);
  },
};

export default courseraProvider;
