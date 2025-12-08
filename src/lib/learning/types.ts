export type LearningResource = {
  id: string;
  title: string;
  url: string;
  provider: 'coursera' | 'udemy' | 'custom';
  skillMatch: string;
  duration?: string;
  level?: string;
  rating?: number;
  badges?: string[];
  price?: string;
};

export type LearningRecommendations = Record<string, LearningResource[]>;

export type LearningProvider = {
  getCoursesForSkills: (skills: string[]) => Promise<LearningRecommendations>;
};

