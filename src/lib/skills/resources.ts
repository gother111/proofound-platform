export type LearningResource = {
  title: string;
  url: string;
  provider: 'Coursera' | 'Pluralsight' | 'Udemy' | 'edX' | 'General';
  level?: 'beginner' | 'intermediate' | 'advanced';
};

type ResourceBucket = {
  keywords: string[];
  resources: LearningResource[];
};

// Curated learning resources keyed by common skill keywords.
const RESOURCE_LIBRARY: ResourceBucket[] = [
  {
    keywords: ['typescript', 'javascript', 'frontend'],
    resources: [
      {
        title: 'TypeScript for React Developers',
        url: 'https://www.pluralsight.com/courses/typescript-react-developers',
        provider: 'Pluralsight',
        level: 'intermediate',
      },
      {
        title: 'Programming with JavaScript',
        url: 'https://www.coursera.org/learn/programming-with-javascript',
        provider: 'Coursera',
        level: 'beginner',
      },
      {
        title: 'Complete TypeScript Developer',
        url: 'https://www.udemy.com/course/understanding-typescript',
        provider: 'Udemy',
        level: 'intermediate',
      },
    ],
  },
  {
    keywords: ['react', 'next.js', 'nextjs', 'frontend'],
    resources: [
      {
        title: 'Building Modern Web Apps with React',
        url: 'https://www.coursera.org/learn/modern-react-apps',
        provider: 'Coursera',
        level: 'intermediate',
      },
      {
        title: 'Advanced React Patterns',
        url: 'https://www.pluralsight.com/courses/react-patterns',
        provider: 'Pluralsight',
        level: 'advanced',
      },
      {
        title: 'Next.js & React - Complete Guide',
        url: 'https://www.udemy.com/course/nextjs-react-the-complete-guide',
        provider: 'Udemy',
        level: 'intermediate',
      },
    ],
  },
  {
    keywords: ['python', 'backend'],
    resources: [
      {
        title: 'Python 3 Programming Specialization',
        url: 'https://www.coursera.org/specializations/python-3-programming',
        provider: 'Coursera',
        level: 'beginner',
      },
      {
        title: 'Python Fundamentals',
        url: 'https://www.pluralsight.com/courses/python-fundamentals',
        provider: 'Pluralsight',
        level: 'beginner',
      },
      {
        title: 'Automate the Boring Stuff with Python',
        url: 'https://www.udemy.com/course/automate',
        provider: 'Udemy',
        level: 'beginner',
      },
    ],
  },
  {
    keywords: ['sql', 'database', 'postgres'],
    resources: [
      {
        title: 'SQL for Data Analysis',
        url: 'https://www.coursera.org/learn/sql-data-analysis',
        provider: 'Coursera',
        level: 'beginner',
      },
      {
        title: 'PostgreSQL for Developers',
        url: 'https://www.pluralsight.com/courses/postgresql-for-developers',
        provider: 'Pluralsight',
        level: 'intermediate',
      },
      {
        title: 'The Complete SQL Bootcamp',
        url: 'https://www.udemy.com/course/the-complete-sql-bootcamp',
        provider: 'Udemy',
        level: 'beginner',
      },
    ],
  },
  {
    keywords: ['data', 'analytics', 'visualization'],
    resources: [
      {
        title: 'Data Analysis with Python',
        url: 'https://www.coursera.org/learn/data-analysis-with-python',
        provider: 'Coursera',
        level: 'intermediate',
      },
      {
        title: 'Power BI Data Analyst',
        url: 'https://www.pluralsight.com/paths/power-bi-data-analyst',
        provider: 'Pluralsight',
        level: 'intermediate',
      },
      {
        title: 'Tableau A-Z: Hands-On Tableau Training',
        url: 'https://www.udemy.com/course/tableau10',
        provider: 'Udemy',
        level: 'beginner',
      },
    ],
  },
  {
    keywords: ['cloud', 'aws', 'azure', 'gcp', 'devops', 'infrastructure'],
    resources: [
      {
        title: 'AWS Cloud Practitioner Essentials',
        url: 'https://www.coursera.org/learn/aws-cloud-practitioner-essentials',
        provider: 'Coursera',
        level: 'beginner',
      },
      {
        title: 'DevOps Foundations',
        url: 'https://www.pluralsight.com/courses/devops-foundations',
        provider: 'Pluralsight',
        level: 'beginner',
      },
      {
        title: 'Google Cloud Digital Leader',
        url: 'https://www.coursera.org/professional-certificates/google-cloud-digital-leader',
        provider: 'Coursera',
        level: 'beginner',
      },
    ],
  },
  {
    keywords: ['product', 'product management', 'pm'],
    resources: [
      {
        title: 'Digital Product Management',
        url: 'https://www.coursera.org/specializations/digital-product-management',
        provider: 'Coursera',
        level: 'intermediate',
      },
      {
        title: 'Product Management First Steps',
        url: 'https://www.pluralsight.com/courses/product-management-first-steps',
        provider: 'Pluralsight',
        level: 'beginner',
      },
      {
        title: 'Become a Product Manager',
        url: 'https://www.udemy.com/course/become-a-product-manager-learn-the-skills-get-a-job',
        provider: 'Udemy',
        level: 'beginner',
      },
    ],
  },
  {
    keywords: ['design', 'ui', 'ux'],
    resources: [
      {
        title: 'UI / UX Design Specialization',
        url: 'https://www.coursera.org/specializations/ui-ux-design',
        provider: 'Coursera',
        level: 'beginner',
      },
      {
        title: 'Figma for Designers',
        url: 'https://www.pluralsight.com/courses/figma-designers',
        provider: 'Pluralsight',
        level: 'beginner',
      },
      {
        title: 'User Experience Design Essentials',
        url: 'https://www.udemy.com/course/ui-ux-web-design-using-adobe-xd',
        provider: 'Udemy',
        level: 'beginner',
      },
    ],
  },
  {
    keywords: ['communication', 'leadership', 'management'],
    resources: [
      {
        title: 'Successful Negotiation',
        url: 'https://www.coursera.org/learn/negotiation',
        provider: 'Coursera',
        level: 'intermediate',
      },
      {
        title: 'Communication Foundations',
        url: 'https://www.pluralsight.com/courses/communication-foundations',
        provider: 'Pluralsight',
        level: 'beginner',
      },
      {
        title: 'Leadership: Practical Leadership Skills',
        url: 'https://www.udemy.com/course/leadership-practical-leadership-skills',
        provider: 'Udemy',
        level: 'beginner',
      },
    ],
  },
];

const DEFAULT_RESOURCES: LearningResource[] = [
  {
    title: 'Learning How to Learn',
    url: 'https://www.coursera.org/learn/learning-how-to-learn',
    provider: 'Coursera',
    level: 'beginner',
  },
  {
    title: 'How to Learn Effectively',
    url: 'https://www.pluralsight.com/courses/learning-effectively',
    provider: 'Pluralsight',
  },
];

function normalize(value?: string | null) {
  return value?.toLowerCase().trim() ?? '';
}

/**
 * Resolve learning resources for a given skill using keyword matches.
 */
export function getLearningResources(skillCode: string, skillName?: string): LearningResource[] {
  const code = normalize(skillCode);
  const name = normalize(skillName);
  const haystack = [code, name];

  for (const bucket of RESOURCE_LIBRARY) {
    const matched = bucket.keywords.some((keyword) =>
      haystack.some((value) => value && value.includes(keyword))
    );

    if (matched) {
      return bucket.resources;
    }
  }

  return DEFAULT_RESOURCES;
}
