/**
 * Controlled taxonomies for matching system.
 *
 * These vocabularies ensure consistent, comparable data across profiles and assignments.
 * No free-text in scorable fields - all selections must come from these controlled lists.
 */

export interface TaxonomyItem {
  key: string;
  label: string;
}

export interface SkillTaxonomyItem extends TaxonomyItem {
  category: string;
}

/**
 * VALUES_TAXONOMY: Core values for mission/culture alignment
 */
export const VALUES_TAXONOMY: TaxonomyItem[] = [
  { key: 'collaboration', label: 'Collaboration' },
  { key: 'innovation', label: 'Innovation' },
  { key: 'sustainability', label: 'Sustainability' },
  { key: 'equity', label: 'Equity & Justice' },
  { key: 'transparency', label: 'Transparency' },
  { key: 'community', label: 'Community-Driven' },
  { key: 'impact', label: 'Impact-First' },
  { key: 'empowerment', label: 'Empowerment' },
  { key: 'integrity', label: 'Integrity' },
  { key: 'resilience', label: 'Resilience' },
  { key: 'inclusion', label: 'Inclusion & Diversity' },
  { key: 'learning', label: 'Continuous Learning' },
  { key: 'accountability', label: 'Accountability' },
  { key: 'creativity', label: 'Creativity' },
  { key: 'systems-thinking', label: 'Systems Thinking' },
  { key: 'long-term', label: 'Long-Term Vision' },
  { key: 'participation', label: 'Democratic Participation' },
  { key: 'solidarity', label: 'Solidarity' },
  { key: 'care', label: 'Care & Compassion' },
  { key: 'autonomy', label: 'Autonomy' },
];

/**
 * CAUSES_TAXONOMY: SDGs and focus areas
 */
export const CAUSES_TAXONOMY: TaxonomyItem[] = [
  { key: 'climate-action', label: 'Climate Action' },
  { key: 'clean-energy', label: 'Clean Energy' },
  { key: 'biodiversity', label: 'Biodiversity & Conservation' },
  { key: 'education', label: 'Quality Education' },
  { key: 'health', label: 'Health & Well-being' },
  { key: 'poverty', label: 'No Poverty' },
  { key: 'hunger', label: 'Zero Hunger' },
  { key: 'gender-equality', label: 'Gender Equality' },
  { key: 'clean-water', label: 'Clean Water & Sanitation' },
  { key: 'decent-work', label: 'Decent Work & Economic Growth' },
  { key: 'innovation-infrastructure', label: 'Innovation & Infrastructure' },
  { key: 'reduced-inequalities', label: 'Reduced Inequalities' },
  { key: 'sustainable-cities', label: 'Sustainable Cities' },
  { key: 'responsible-consumption', label: 'Responsible Consumption' },
  { key: 'life-below-water', label: 'Life Below Water' },
  { key: 'life-on-land', label: 'Life On Land' },
  { key: 'peace-justice', label: 'Peace, Justice & Strong Institutions' },
  { key: 'partnerships', label: 'Partnerships for the Goals' },
  { key: 'human-rights', label: 'Human Rights' },
  { key: 'refugee-migration', label: 'Refugee & Migration Support' },
  { key: 'mental-health', label: 'Mental Health' },
  { key: 'digital-rights', label: 'Digital Rights & Privacy' },
  { key: 'civic-tech', label: 'Civic Technology' },
  { key: 'arts-culture', label: 'Arts & Culture' },
  { key: 'food-systems', label: 'Regenerative Food Systems' },
];

/**
 * SKILLS_TAXONOMY: Technical and soft skills
 */
export const SKILLS_TAXONOMY: SkillTaxonomyItem[] = [
  // Technical - Engineering
  { key: 'javascript', label: 'JavaScript', category: 'Engineering' },
  { key: 'typescript', label: 'TypeScript', category: 'Engineering' },
  { key: 'python', label: 'Python', category: 'Engineering' },
  { key: 'react', label: 'React', category: 'Engineering' },
  { key: 'node', label: 'Node.js', category: 'Engineering' },
  { key: 'sql', label: 'SQL & Databases', category: 'Engineering' },
  { key: 'devops', label: 'DevOps & CI/CD', category: 'Engineering' },
  { key: 'cloud', label: 'Cloud Infrastructure', category: 'Engineering' },
  { key: 'api-design', label: 'API Design', category: 'Engineering' },
  { key: 'testing', label: 'Testing & QA', category: 'Engineering' },

  // Technical - Data & AI
  { key: 'data-analysis', label: 'Data Analysis', category: 'Data & AI' },
  { key: 'machine-learning', label: 'Machine Learning', category: 'Data & AI' },
  { key: 'data-visualization', label: 'Data Visualization', category: 'Data & AI' },
  { key: 'statistical-modeling', label: 'Statistical Modeling', category: 'Data & AI' },

  // Design
  { key: 'ui-design', label: 'UI Design', category: 'Design' },
  { key: 'ux-research', label: 'UX Research', category: 'Design' },
  { key: 'service-design', label: 'Service Design', category: 'Design' },
  { key: 'design-systems', label: 'Design Systems', category: 'Design' },
  { key: 'accessibility', label: 'Accessibility (A11y)', category: 'Design' },

  // Product & Strategy
  { key: 'product-management', label: 'Product Management', category: 'Product & Strategy' },
  { key: 'product-strategy', label: 'Product Strategy', category: 'Product & Strategy' },
  { key: 'roadmap-planning', label: 'Roadmap Planning', category: 'Product & Strategy' },
  { key: 'user-research', label: 'User Research', category: 'Product & Strategy' },

  // Communication & Leadership
  { key: 'facilitation', label: 'Facilitation', category: 'Leadership' },
  { key: 'stakeholder-management', label: 'Stakeholder Management', category: 'Leadership' },
  { key: 'public-speaking', label: 'Public Speaking', category: 'Leadership' },
  { key: 'writing', label: 'Writing & Communication', category: 'Leadership' },
  { key: 'team-leadership', label: 'Team Leadership', category: 'Leadership' },
  { key: 'coaching-mentoring', label: 'Coaching & Mentoring', category: 'Leadership' },

  // Fundraising & Finance
  { key: 'grant-writing', label: 'Grant Writing', category: 'Fundraising & Finance' },
  { key: 'fundraising', label: 'Fundraising', category: 'Fundraising & Finance' },
  { key: 'budget-management', label: 'Budget Management', category: 'Fundraising & Finance' },
  { key: 'financial-modeling', label: 'Financial Modeling', category: 'Fundraising & Finance' },

  // Impact & Research
  { key: 'impact-measurement', label: 'Impact Measurement', category: 'Impact & Research' },
  { key: 'qualitative-research', label: 'Qualitative Research', category: 'Impact & Research' },
  { key: 'quantitative-research', label: 'Quantitative Research', category: 'Impact & Research' },
  { key: 'participatory-research', label: 'Participatory Research', category: 'Impact & Research' },

  // Operations & Legal
  { key: 'operations', label: 'Operations Management', category: 'Operations' },
  { key: 'project-management', label: 'Project Management', category: 'Operations' },
  { key: 'legal', label: 'Legal & Compliance', category: 'Operations' },
  { key: 'hr', label: 'HR & People Ops', category: 'Operations' },

  // Marketing & Communications
  { key: 'marketing-strategy', label: 'Marketing Strategy', category: 'Marketing' },
  { key: 'content-creation', label: 'Content Creation', category: 'Marketing' },
  { key: 'social-media', label: 'Social Media', category: 'Marketing' },
  { key: 'storytelling', label: 'Storytelling', category: 'Marketing' },
  { key: 'branding', label: 'Branding', category: 'Marketing' },
];

/**
 * CEFR Language levels for language proficiency
 */
export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type CEFRLevel = (typeof CEFR_LEVELS)[number];

/**
 * Common languages
 */
export const LANGUAGE_OPTIONS: TaxonomyItem[] = [
  { key: 'en', label: 'English' },
  { key: 'es', label: 'Spanish' },
  { key: 'fr', label: 'French' },
  { key: 'de', label: 'German' },
  { key: 'it', label: 'Italian' },
  { key: 'pt', label: 'Portuguese' },
  { key: 'zh', label: 'Chinese' },
  { key: 'ja', label: 'Japanese' },
  { key: 'ko', label: 'Korean' },
  { key: 'ar', label: 'Arabic' },
  { key: 'hi', label: 'Hindi' },
  { key: 'ru', label: 'Russian' },
  { key: 'sv', label: 'Swedish' },
  { key: 'nl', label: 'Dutch' },
  { key: 'pl', label: 'Polish' },
];

/**
 * Currency options
 */
export const CURRENCY_OPTIONS: TaxonomyItem[] = [
  { key: 'USD', label: 'USD ($)' },
  { key: 'EUR', label: 'EUR (€)' },
  { key: 'GBP', label: 'GBP (£)' },
  { key: 'SEK', label: 'SEK (kr)' },
  { key: 'CAD', label: 'CAD ($)' },
  { key: 'AUD', label: 'AUD ($)' },
  { key: 'JPY', label: 'JPY (¥)' },
  { key: 'CHF', label: 'CHF (CHF)' },
];

/**
 * Helper functions
 */
export function getTaxonomyItem(key: string, taxonomy: TaxonomyItem[]): TaxonomyItem | undefined {
  return taxonomy.find((item) => item.key === key);
}

export function getTaxonomyLabel(key: string, taxonomy: TaxonomyItem[]): string {
  return getTaxonomyItem(key, taxonomy)?.label || key;
}
