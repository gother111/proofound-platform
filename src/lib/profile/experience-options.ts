export const EXPERIENCE_ORGANIZATION_TYPE_OPTIONS = [
  { value: 'company', label: 'Company' },
  { value: 'ngo', label: 'NGO' },
  { value: 'government', label: 'Government' },
  { value: 'academic', label: 'Academic Institution' },
  { value: 'network', label: 'Network/Association' },
  { value: 'other', label: 'Other' },
] as const;

export type ExperienceOrganizationType =
  (typeof EXPERIENCE_ORGANIZATION_TYPE_OPTIONS)[number]['value'];

export const EXPERIENCE_EMPLOYEE_AMOUNT_OPTIONS = [
  { value: '1-10', label: '1-10' },
  { value: '11-50', label: '11-50' },
  { value: '51-200', label: '51-200' },
  { value: '201-500', label: '201-500' },
  { value: '501-1000', label: '501-1000' },
  { value: '1001-5000', label: '1001-5000' },
  { value: '5001+', label: '5001+' },
] as const;

export type ExperienceEmployeeAmount = (typeof EXPERIENCE_EMPLOYEE_AMOUNT_OPTIONS)[number]['value'];

export const EXPERIENCE_PARTICIPATION_CAPACITY_OPTIONS = [
  { value: 'owned', label: 'Owned' },
  { value: 'co_led', label: 'Co-led' },
  { value: 'contributed', label: 'Contributed' },
] as const;

export type ExperienceParticipationCapacity =
  (typeof EXPERIENCE_PARTICIPATION_CAPACITY_OPTIONS)[number]['value'];

export const EXPERIENCE_INDUSTRY_PRESET_OPTIONS = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Government',
  'Nonprofit',
  'Manufacturing',
  'Retail',
  'Media',
  'Energy',
  'Transportation',
  'Real Estate',
  'Other',
] as const;
