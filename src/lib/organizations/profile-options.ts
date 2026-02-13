export const ORGANIZATION_SIZE_VALUES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5001+',
] as const;

export const LEGAL_FORM_VALUES = [
  'sole_proprietorship',
  'partnership',
  'llc',
  'corporation',
  'nonprofit',
  'cooperative',
  'benefit_corporation',
  'other',
] as const;

export type OrganizationSizeValue = (typeof ORGANIZATION_SIZE_VALUES)[number];
export type LegalFormValue = (typeof LEGAL_FORM_VALUES)[number];

export const ORGANIZATION_SIZE_OPTIONS: ReadonlyArray<{
  value: OrganizationSizeValue;
  label: string;
}> = [
  { value: '1-10', label: '1-10' },
  { value: '11-50', label: '11-50' },
  { value: '51-200', label: '51-200' },
  { value: '201-500', label: '201-500' },
  { value: '501-1000', label: '501-1000' },
  { value: '1001-5000', label: '1001-5000' },
  { value: '5001+', label: '5001+' },
];

export const LEGAL_FORM_OPTIONS: ReadonlyArray<{
  value: LegalFormValue;
  label: string;
}> = [
  { value: 'sole_proprietorship', label: 'Sole proprietorship' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'llc', label: 'LLC' },
  { value: 'corporation', label: 'Corporation' },
  { value: 'nonprofit', label: 'Nonprofit' },
  { value: 'cooperative', label: 'Cooperative' },
  { value: 'benefit_corporation', label: 'Benefit corporation' },
  { value: 'other', label: 'Other' },
];
